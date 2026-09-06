import logging
import re
import time
from typing import Any, Dict, List, Optional, Tuple

from rag_service.domain.models import Message, MessageRole
from rag_service.domain.protocols import LLMProvider
from rag_service.knowledge_cafe.course_loader import (
    CourseDefinition,
    CourseLoader,
    LessonMetadata,
    get_course_loader,
)
from rag_service.prompts.loader import PromptLoader, get_prompt_loader

logger = logging.getLogger("rag_service.knowledge_cafe.engine")


class KTEngine:
    """
    Core engine for Knowledge Cafe e-learning sessions.
    Synthesizes guided lessons grounded strictly in creator-defined course context files.
    Answers in-lesson doubts with adaptive explanations.
    """

    def __init__(
        self,
        llm_provider: LLMProvider,
        course_loader: Optional[CourseLoader] = None,
        prompt_loader: Optional[PromptLoader] = None,
    ):
        self.llm_provider = llm_provider
        self.course_loader = course_loader or get_course_loader()
        self.prompt_loader = prompt_loader or get_prompt_loader()

    def list_courses(self) -> List[Dict[str, Any]]:
        courses = self.course_loader.list_courses()
        return [c.to_summary_dict() for c in courses]

    def get_course_detail(self, course_id: str) -> Optional[Dict[str, Any]]:
        course = self.course_loader.get_course(course_id)
        if not course:
            return None
        return course.to_dict()

    async def synthesize_lesson(
        self,
        course_id: str,
        lesson_id: str,
        previous_summary: Optional[str] = None,
        model: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Synthesizes a comprehensive, pedagogical lesson using ONLY the lesson's context files.
        """
        start_time = time.perf_counter()
        course = self.course_loader.get_course(course_id)
        if not course:
            raise ValueError(f"Course '{course_id}' not found.")

        lesson = None
        for l in course.lessons:
            if l.id == lesson_id:
                lesson = l
                break

        if not lesson:
            raise ValueError(f"Lesson '{lesson_id}' not found in course '{course_id}'.")

        # 1. Read dedicated context files for this lesson
        file_contents = self.course_loader.read_lesson_context_files(course_id, lesson_id)
        if not file_contents:
            context_text = f"Overview: {lesson.summary}"
            sources = []
        else:
            context_blocks = []
            sources = []
            for file_name, content in file_contents:
                context_blocks.append(f"=== File: {file_name} ===\n{content}\n")
                sources.append({
                    "file": file_name,
                    "service": course.target_service,
                    "doc_type": "course_context",
                    "snippet": content[:200] + "..." if len(content) > 200 else content,
                })
            context_text = "\n---------------------\n".join(context_blocks)

        # 2. Render prompt
        prev_summary_text = previous_summary or "This is the first lesson of the course."
        prompt_content = self.prompt_loader.render(
            "kt_lesson_synthesis",
            course_title=course.title,
            domain=course.domain,
            target_service=course.target_service,
            lesson_number=lesson.lesson_index + 1,
            lesson_title=lesson.title,
            lesson_summary=lesson.summary,
            previous_context_summary=prev_summary_text,
            lesson_context=context_text,
        )

        messages = [Message(role=MessageRole.USER, content=prompt_content)]
        system_prompt = (
            f"You are an expert Principal Engineer delivering an authoritative, engaging Knowledge Transfer "
            f"masterclass on '{course.title}'. Teach with exceptional technical clarity, clean formatting, "
            f"and strict adherence to the provided course documentation."
        )

        llm_response = await self.llm_provider.generate(
            messages=messages,
            system_prompt=system_prompt,
            temperature=0.2,
            model=model,
        )

        raw_content = llm_response.content
        latency_ms = int((time.perf_counter() - start_time) * 1000)

        # 3. Extract takeaways if present
        clean_content = raw_content
        takeaways = []
        takeaway_match = re.search(r"```takeaways\s*([\s\S]*?)\s*```", raw_content, re.IGNORECASE)
        if takeaway_match:
            lines = takeaway_match.group(1).strip().splitlines()
            for line in lines:
                clean_line = line.strip().lstrip("-*•").strip()
                if clean_line:
                    takeaways.append(clean_line)
            # Remove takeaways code block from main markdown to keep it clean
            clean_content = raw_content[:takeaway_match.start()].rstrip() + "\n\n" + raw_content[takeaway_match.end():].lstrip()

        # Fallback takeaways if model didn't format block
        if not takeaways:
            takeaways = [
                f"Mastered core principles of {lesson.title}",
                f"Understood integration points and domain boundaries for {course.target_service}",
                f"Reviewed verified implementation patterns and error-handling paths",
            ]

        return {
            "course_id": course_id,
            "lesson_id": lesson_id,
            "lesson_index": lesson.lesson_index,
            "title": lesson.title,
            "summary": lesson.summary,
            "content": clean_content.strip(),
            "takeaways": takeaways,
            "sources": sources,
            "latency_ms": latency_ms,
            "model": llm_response.model or model or "default",
        }

    async def answer_doubt(
        self,
        course_id: str,
        lesson_id: str,
        question: str,
        lesson_content_snippet: str = "",
        model: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Answers an in-lesson developer doubt grounded in the lesson's context files.
        """
        start_time = time.perf_counter()
        course = self.course_loader.get_course(course_id)
        if not course:
            raise ValueError(f"Course '{course_id}' not found.")

        lesson = self.course_loader.get_lesson(course_id, lesson_id)
        if not lesson:
            raise ValueError(f"Lesson '{lesson_id}' not found.")

        file_contents = self.course_loader.read_lesson_context_files(course_id, lesson_id)
        context_blocks = []
        sources = []
        for file_name, content in file_contents:
            context_blocks.append(f"=== File: {file_name} ===\n{content}\n")
            sources.append({
                "file": file_name,
                "service": course.target_service,
                "doc_type": "course_context",
                "snippet": content[:200] + "..." if len(content) > 200 else content,
            })
        context_text = "\n---------------------\n".join(context_blocks) if context_blocks else lesson.summary

        prompt_content = self.prompt_loader.render(
            "kt_lesson_doubt",
            course_title=course.title,
            lesson_number=lesson.lesson_index + 1,
            lesson_title=lesson.title,
            lesson_context=context_text,
            lesson_content_snippet=lesson_content_snippet[:1500],
            question=question,
        )

        messages = [Message(role=MessageRole.USER, content=prompt_content)]
        system_prompt = (
            f"You are a Principal Engineer mentoring a developer during a Knowledge Transfer session for "
            f"'{course.title}'. Answer doubts accurately and concisely using the provided context."
        )

        llm_response = await self.llm_provider.generate(
            messages=messages,
            system_prompt=system_prompt,
            temperature=0.2,
            model=model,
        )

        latency_ms = int((time.perf_counter() - start_time) * 1000)
        return {
            "answer": llm_response.content.strip(),
            "sources": sources,
            "latency_ms": latency_ms,
            "model": llm_response.model or model or "default",
        }

    def read_document(self, course_id: str, file_path: str) -> Tuple[str, str]:
        return self.course_loader.read_course_document(course_id, file_path)

from dataclasses import dataclass, field
import os
from pathlib import Path
import re
from typing import Any, Dict, List, Optional, Tuple
import yaml


@dataclass
class KnowledgeCheckOption:
    text: str
    is_correct: bool = False


@dataclass
class KnowledgeCheck:
    question: str
    type: str = "multiple_choice"
    options: List[str] = field(default_factory=list)
    correct_option_index: int = 0
    explanation: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "question": self.question,
            "type": self.type,
            "options": self.options,
            "correct_option_index": self.correct_option_index,
            "explanation": self.explanation,
        }


@dataclass
class LessonMetadata:
    id: str
    lesson_index: int
    title: str
    summary: str
    context_files: List[str] = field(default_factory=list)
    knowledge_check: Optional[KnowledgeCheck] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "lesson_index": self.lesson_index,
            "title": self.title,
            "summary": self.summary,
            "context_files": self.context_files,
            "knowledge_check": self.knowledge_check.to_dict() if self.knowledge_check else None,
        }


@dataclass
class CourseDefinition:
    id: str
    title: str
    description: str
    target_service: str
    domain: str = "Engineering"
    target_audience: str = "All Engineers"
    difficulty: str = "Intermediate"
    estimated_duration: str = "1 hour"
    icon: str = "Layers"
    tags: List[str] = field(default_factory=list)
    lessons: List[LessonMetadata] = field(default_factory=list)
    course_dir: Optional[Path] = None

    def to_summary_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "target_service": self.target_service,
            "domain": self.domain,
            "target_audience": self.target_audience,
            "difficulty": self.difficulty,
            "estimated_duration": self.estimated_duration,
            "icon": self.icon,
            "tags": self.tags,
            "total_lessons": len(self.lessons),
        }

    def to_dict(self) -> Dict[str, Any]:
        data = self.to_summary_dict()
        data["lessons"] = [l.to_dict() for l in self.lessons]
        return data


class CourseLoader:
    """
    Dynamically loads and validates Knowledge Cafe courses from course-structure.md files.
    Ensures strict course-specific context isolation and path traversal security.
    """

    def __init__(self, courses_dir: Optional[Path | str] = None):
        if courses_dir:
            self.courses_dir = Path(courses_dir).resolve()
        else:
            self.courses_dir = (Path(__file__).resolve().parent / "courses").resolve()

    def list_courses(self) -> List[CourseDefinition]:
        courses: List[CourseDefinition] = []
        if not self.courses_dir.exists():
            return courses

        for item in sorted(self.courses_dir.iterdir()):
            if item.is_dir():
                structure_file = item / "course-structure.md"
                if structure_file.is_file():
                    try:
                        course = self._parse_course_structure(structure_file, item)
                        if course:
                            courses.append(course)
                    except Exception as e:
                        # Log and continue so one invalid course doesn't break catalog
                        pass
        return courses

    def get_course(self, course_id: str) -> Optional[CourseDefinition]:
        for course in self.list_courses():
            if course.id == course_id:
                return course
        return None

    def get_lesson(self, course_id: str, lesson_id: str) -> Optional[LessonMetadata]:
        course = self.get_course(course_id)
        if not course:
            return None
        for lesson in course.lessons:
            if lesson.id == lesson_id:
                return lesson
        return None

    def read_lesson_context_files(
        self, course_id: str, lesson_id: str
    ) -> List[Tuple[str, str]]:
        """
        Securely read all dedicated context files associated with a specific lesson.
        Returns list of tuples: (relative_file_path, file_content)
        """
        course = self.get_course(course_id)
        if not course or not course.course_dir:
            return []

        lesson = None
        for l in course.lessons:
            if l.id == lesson_id:
                lesson = l
                break

        if not lesson:
            return []

        results: List[Tuple[str, str]] = []
        for rel_path in lesson.context_files:
            clean_rel = rel_path.strip().lstrip("/\\")
            full_path = (course.course_dir / clean_rel).resolve()
            # Enforce path traversal security: must be strictly inside course directory
            if not full_path.is_relative_to(course.course_dir):
                continue
            if full_path.is_file():
                try:
                    content = full_path.read_text(encoding="utf-8", errors="replace")
                    results.append((full_path.name, content))
                except Exception:
                    pass
        return results

    def read_course_document(self, course_id: str, file_name_or_path: str) -> Tuple[str, str]:
        """
        Securely read a course context file by relative path or file name.
        Returns (file_name, content).
        Raises FileNotFoundError or PermissionError.
        """
        course = self.get_course(course_id)
        if not course or not course.course_dir:
            raise FileNotFoundError(f"Course '{course_id}' not found.")

        clean = file_name_or_path.strip().lstrip("/\\")
        candidate = (course.course_dir / clean).resolve()

        if not candidate.is_relative_to(course.course_dir):
            raise PermissionError("Path traversal detected outside course boundary.")

        if candidate.is_file():
            return candidate.name, candidate.read_text(encoding="utf-8", errors="replace")

        # Search recursively inside lessons folder by filename
        for f in course.course_dir.rglob("*.md"):
            if f.name == clean or f.name == Path(clean).name:
                if f.is_relative_to(course.course_dir):
                    return f.name, f.read_text(encoding="utf-8", errors="replace")

        raise FileNotFoundError(f"Context document '{file_name_or_path}' not found in course '{course_id}'.")

    def _parse_course_structure(self, file_path: Path, course_dir: Path) -> Optional[CourseDefinition]:
        text = file_path.read_text(encoding="utf-8", errors="replace")

        # 1. Parse YAML Frontmatter
        frontmatter_data: Dict[str, Any] = {}
        content_markdown = text

        if text.startswith("---"):
            parts = text.split("---", 2)
            if len(parts) >= 3:
                try:
                    frontmatter_data = yaml.safe_load(parts[1]) or {}
                    content_markdown = parts[2]
                except Exception:
                    pass

        course_id = frontmatter_data.get("id") or course_dir.name
        title = frontmatter_data.get("title") or course_dir.name.replace("-", " ").title()
        description = frontmatter_data.get("description", "")
        target_service = frontmatter_data.get("target_service", "default-service")
        domain = frontmatter_data.get("domain", "Microservices & Engineering")
        target_audience = frontmatter_data.get("target_audience", "Engineers")
        difficulty = frontmatter_data.get("difficulty", "Intermediate")
        estimated_duration = frontmatter_data.get("estimated_duration", "1 hour")
        icon = frontmatter_data.get("icon", "Layers")
        tags = frontmatter_data.get("tags") or []

        # 2. Parse Lessons from Markdown Headings (## XX. Title or ## Title)
        lessons: List[LessonMetadata] = []
        sections = re.split(r"\n(?=##\s+)", content_markdown)

        lesson_idx = 0
        for sec in sections:
            sec = sec.strip()
            if not sec.startswith("##"):
                continue

            lines = sec.splitlines()
            header_line = lines[0].lstrip("#").strip()

            # Parse title and optional index number
            m = re.match(r"^(\d+)\.?\s*(.*)", header_line)
            if m:
                lesson_title = m.group(2).strip() or header_line
            else:
                lesson_title = header_line

            slug_id = re.sub(r"[^a-zA-Z0-9]+", "-", lesson_title.lower()).strip("-")
            formatted_id = f"{lesson_idx+1:02d}-{slug_id}"

            # Extract fields from body
            body = "\n".join(lines[1:])
            summary = ""
            context_files: List[str] = []
            knowledge_check: Optional[KnowledgeCheck] = None

            # Summary regex
            sum_match = re.search(r"-\s*\*\*Summary\*\*:\s*(.+)", body)
            if sum_match:
                summary = sum_match.group(1).strip()

            # Context files regex (stop before next top-level bullet like - **Knowledge Check**)
            context_match = re.search(r"-\s*\*\*Context\*\*:\s*\n((?:[ \t]+-\s+[^\n]+\n?)+)", body)
            if context_match:
                context_block = context_match.group(1)
                for c_line in context_block.splitlines():
                    c_line = c_line.strip()
                    if c_line.startswith("-"):
                        c_file = c_line.lstrip("-").strip().strip("`")
                        if c_file and not c_file.startswith("**"):
                            context_files.append(c_file)

            # Knowledge check regex
            kc_match = re.search(r"-\s*\*\*Knowledge Check\*\*:\s*\n((?:[ \t].*\n?)+)", body)
            if kc_match:
                kc_block = kc_match.group(1)
                q_match = re.search(r"-\s*\*\*Question\*\*:\s*(.+)", kc_block)
                type_match = re.search(r"-\s*\*\*Type\*\*:\s*(.+)", kc_block)
                exp_match = re.search(r"-\s*\*\*Explanation\*\*:\s*(.+)", kc_block)

                opts_match = re.search(r"-\s*\*\*Options\*\*:\s*\n((?:\s*-\s*.+\n?)+)", kc_block)
                options: List[str] = []
                correct_idx = 0

                if opts_match:
                    opt_lines = opts_match.group(1).splitlines()
                    for opt_i, opt_l in enumerate(opt_lines):
                        opt_l = opt_l.strip().lstrip("-").strip()
                        if not opt_l:
                            continue
                        if opt_l.startswith("[x]") or opt_l.startswith("[X]"):
                            correct_idx = len(options)
                            clean_opt = opt_l[3:].strip()
                            options.append(clean_opt)
                        else:
                            clean_opt = opt_l.replace("[ ]", "").strip()
                            options.append(clean_opt)

                if q_match and options:
                    knowledge_check = KnowledgeCheck(
                        question=q_match.group(1).strip(),
                        type=type_match.group(1).strip() if type_match else "multiple_choice",
                        options=options,
                        correct_option_index=correct_idx,
                        explanation=exp_match.group(1).strip() if exp_match else "",
                    )

            lessons.append(
                LessonMetadata(
                    id=formatted_id,
                    lesson_index=lesson_idx,
                    title=lesson_title,
                    summary=summary,
                    context_files=context_files,
                    knowledge_check=knowledge_check,
                )
            )
            lesson_idx += 1

        return CourseDefinition(
            id=course_id,
            title=title,
            description=description,
            target_service=target_service,
            domain=domain,
            target_audience=target_audience,
            difficulty=difficulty,
            estimated_duration=estimated_duration,
            icon=icon,
            tags=tags,
            lessons=lessons,
            course_dir=course_dir,
        )


_course_loader: Optional[CourseLoader] = None


def get_course_loader() -> CourseLoader:
    global _course_loader
    if _course_loader is None:
        _course_loader = CourseLoader()
    return _course_loader

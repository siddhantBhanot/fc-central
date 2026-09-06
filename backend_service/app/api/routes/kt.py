from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse

from backend_service.app.api.dependencies import (
    get_current_user,
    get_kt_service,
    get_optional_current_user,
)
from backend_service.app.api.schemas.documents import DocumentDetailResponse
from backend_service.app.api.schemas.kt import (
    CompleteLessonResponse,
    CourseDetailResponse,
    CourseSummaryResponse,
    DoubtRequest,
    DoubtResponse,
    EnrollResponse,
    KnowledgeCheckSubmitRequest,
    KnowledgeCheckSubmitResponse,
    LessonDetailResponse,
)
from backend_service.app.application.services.kt_service import KTService
from backend_service.app.domain.models.user import User

router = APIRouter(prefix="/kt", tags=["Knowledge Cafe"])


@router.get("/courses", response_model=List[CourseSummaryResponse])
async def list_courses(
    current_user: Optional[User] = Depends(get_optional_current_user),
    kt_service: KTService = Depends(get_kt_service),
) -> List[CourseSummaryResponse]:
    """
    Browse all creator-defined Knowledge Cafe courses with live user enrollment progress.
    """
    user_id = current_user.id if current_user else None
    courses = await kt_service.list_courses(user_id=user_id)
    return [CourseSummaryResponse(**c) for c in courses]


@router.get("/courses/{course_id}", response_model=CourseDetailResponse)
async def get_course(
    course_id: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    kt_service: KTService = Depends(get_kt_service),
) -> CourseDetailResponse:
    """
    Retrieve full course curriculum roadmap and lesson sequence from course-structure.md.
    """
    user_id = current_user.id if current_user else None
    course = await kt_service.get_course(course_id=course_id, user_id=user_id)
    return CourseDetailResponse(**course)


@router.post("/courses/{course_id}/enroll", response_model=EnrollResponse)
async def enroll_or_resume(
    course_id: str,
    current_user: User = Depends(get_current_user),
    kt_service: KTService = Depends(get_kt_service),
) -> EnrollResponse:
    """
    Enroll in a course or resume learning from the last active lesson.
    """
    res = await kt_service.enroll_or_resume(course_id=course_id, user_id=current_user.id)
    return EnrollResponse(**res)


@router.get("/courses/{course_id}/lessons/{lesson_id}", response_model=LessonDetailResponse)
async def get_lesson(
    course_id: str,
    lesson_id: str,
    model: Optional[str] = Query(None, description="Optional LLM model override"),
    current_user: User = Depends(get_current_user),
    kt_service: KTService = Depends(get_kt_service),
) -> LessonDetailResponse:
    """
    Retrieve or synthesize a lesson using its dedicated course context files.
    """
    res = await kt_service.get_lesson_content(
        course_id=course_id,
        lesson_id=lesson_id,
        user_id=current_user.id,
        model=model,
    )
    return LessonDetailResponse(**res)


@router.get("/courses/{course_id}/lessons/{lesson_id}/stream")
async def get_lesson_stream(
    course_id: str,
    lesson_id: str,
    model: Optional[str] = Query(None, description="Optional LLM model override"),
    current_user: User = Depends(get_current_user),
    kt_service: KTService = Depends(get_kt_service),
) -> StreamingResponse:
    """
    Stream progressive lesson synthesis tokens via SSE.
    """
    generator = kt_service.get_lesson_content_stream(
        course_id=course_id,
        lesson_id=lesson_id,
        user_id=current_user.id,
        model=model,
    )
    return StreamingResponse(
        generator,
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/courses/{course_id}/lessons/{lesson_id}/complete", response_model=CompleteLessonResponse)
async def complete_lesson(
    course_id: str,
    lesson_id: str,
    current_user: User = Depends(get_current_user),
    kt_service: KTService = Depends(get_kt_service),
) -> CompleteLessonResponse:
    """
    Mark a lesson completed and unlock the next lesson in the curriculum.
    """
    res = await kt_service.complete_lesson(
        course_id=course_id,
        lesson_id=lesson_id,
        user_id=current_user.id,
    )
    return CompleteLessonResponse(**res)


@router.post("/courses/{course_id}/lessons/{lesson_id}/doubts", response_model=DoubtResponse)
async def ask_doubt(
    course_id: str,
    lesson_id: str,
    payload: DoubtRequest,
    current_user: User = Depends(get_current_user),
    kt_service: KTService = Depends(get_kt_service),
) -> DoubtResponse:
    """
    Ask a question during a lesson. Answered grounded in the lesson's context files without losing lesson position.
    """
    res = await kt_service.ask_doubt(
        course_id=course_id,
        lesson_id=lesson_id,
        question=payload.question,
        user_id=current_user.id,
        model=payload.model,
    )
    return DoubtResponse(**res)


@router.post("/courses/{course_id}/lessons/{lesson_id}/doubts/stream")
async def ask_doubt_stream(
    course_id: str,
    lesson_id: str,
    payload: DoubtRequest,
    current_user: User = Depends(get_current_user),
    kt_service: KTService = Depends(get_kt_service),
) -> StreamingResponse:
    """
    Ask a question during a lesson with real-time SSE token streaming.
    """
    generator = kt_service.ask_doubt_stream(
        course_id=course_id,
        lesson_id=lesson_id,
        question=payload.question,
        user_id=current_user.id,
        model=payload.model,
    )
    return StreamingResponse(
        generator,
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/courses/{course_id}/lessons/{lesson_id}/check", response_model=KnowledgeCheckSubmitResponse)
async def submit_knowledge_check(
    course_id: str,
    lesson_id: str,
    payload: KnowledgeCheckSubmitRequest,
    current_user: User = Depends(get_current_user),
    kt_service: KTService = Depends(get_kt_service),
) -> KnowledgeCheckSubmitResponse:
    """
    Submit an answer for an interactive knowledge check.
    """
    res = await kt_service.submit_knowledge_check(
        course_id=course_id,
        lesson_id=lesson_id,
        selected_option_index=payload.selected_option_index,
        user_id=current_user.id,
    )
    return KnowledgeCheckSubmitResponse(**res)


@router.get("/courses/{course_id}/documents", response_model=DocumentDetailResponse)
async def get_course_document(
    course_id: str,
    file: str = Query(..., min_length=1, description="Context document file path"),
    current_user: User = Depends(get_current_user),
    kt_service: KTService = Depends(get_kt_service),
) -> DocumentDetailResponse:
    """
    Safely retrieve full content of a course context document for 'View Source' inspection.
    """
    doc = await kt_service.get_course_document(course_id=course_id, file_path=file)
    return DocumentDetailResponse(
        file=doc.file,
        service=doc.service,
        content=doc.content,
        content_type=doc.content_type,
        total_lines=doc.total_lines,
        size_bytes=doc.size_bytes,
    )

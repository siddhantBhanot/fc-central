from typing import Any, Dict, List
from fastapi import APIRouter, Depends

from backend_service.app.api.dependencies import get_feedback_service
from backend_service.app.api.schemas.feedback import FeedbackRequest, FeedbackResponse
from backend_service.app.application.services.feedback_service import FeedbackService

router = APIRouter(prefix="/feedback", tags=["Feedback"])


@router.post("", response_model=FeedbackResponse)
async def submit_feedback(
    payload: FeedbackRequest,
    feedback_service: FeedbackService = Depends(get_feedback_service),
) -> FeedbackResponse:
    """
    Submit user feedback (positive or negative rating + optional comment) on an answer.
    """
    result = await feedback_service.submit_feedback(
        message_id=payload.message_id,
        conversation_id=payload.conversation_id,
        rating=payload.rating,
        comment=payload.comment,
    )
    return FeedbackResponse(**result)


@router.get("/{message_id}", response_model=List[Dict[str, Any]])
async def get_message_feedback(
    message_id: str,
    feedback_service: FeedbackService = Depends(get_feedback_service),
) -> List[Dict[str, Any]]:
    """
    Retrieve all feedback entries associated with a message.
    """
    return await feedback_service.get_message_feedback(message_id)

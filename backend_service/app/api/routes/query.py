from typing import List, Optional
from fastapi import APIRouter, Depends, Query

from backend_service.app.api.dependencies import get_current_user, get_query_service
from backend_service.app.api.schemas.query import (
    ConversationDetailResponse,
    ConversationSummary,
    MessageSchema,
    QueryRequest,
    QueryResponse,
    SourceCitationSchema,
)
from backend_service.app.application.services.query_service import QueryService
from backend_service.app.domain.models.user import User

router = APIRouter(tags=["Query & Conversations"])


@router.post("/query", response_model=QueryResponse)
async def execute_query(
    payload: QueryRequest,
    current_user: User = Depends(get_current_user),
    query_service: QueryService = Depends(get_query_service),
) -> QueryResponse:
    """
    Execute a natural language query against indexed microservice knowledge.
    Manages multi-turn conversation persistence scoped to the authenticated user and returns grounded source citations.
    """
    result = await query_service.execute_query(
        query_text=payload.query,
        conversation_id=payload.conversation_id,
        service=payload.service,
        top_k=payload.top_k,
        user_id=current_user.id,
    )
    return QueryResponse(**result)


@router.get("/conversations/{conversation_id}", response_model=ConversationDetailResponse)
async def get_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    query_service: QueryService = Depends(get_query_service),
) -> ConversationDetailResponse:
    """
    Retrieve full message history and metadata for a conversation session owned by the authenticated user.
    """
    conversation = await query_service.get_conversation_history(
        conversation_id=conversation_id,
        user_id=current_user.id,
    )
    messages = [
        MessageSchema(
            id=m.id,
            role=m.role.value,
            content=m.content,
            sources=[SourceCitationSchema(**s.to_dict()) for s in m.sources],
            created_at=m.created_at.isoformat(),
        )
        for m in conversation.messages
    ]
    return ConversationDetailResponse(
        id=conversation.id,
        service=conversation.service,
        title=conversation.title,
        created_at=conversation.created_at.isoformat(),
        updated_at=conversation.updated_at.isoformat(),
        messages=messages,
    )


@router.get("/conversations", response_model=List[ConversationSummary])
async def list_conversations(
    service: Optional[str] = Query(default=None, description="Filter by service name"),
    limit: int = Query(default=20, ge=1, le=100, description="Max conversations to return"),
    current_user: User = Depends(get_current_user),
    query_service: QueryService = Depends(get_query_service),
) -> List[ConversationSummary]:
    """
    List conversations belonging exclusively to the authenticated user, ordered chronologically by last activity.
    """
    conversations = await query_service.list_conversations(
        service=service,
        limit=limit,
        user_id=current_user.id,
    )
    return [
        ConversationSummary(
            id=c.id,
            service=c.service,
            title=c.title,
            created_at=c.created_at.isoformat(),
            updated_at=c.updated_at.isoformat(),
        )
        for c in conversations
    ]


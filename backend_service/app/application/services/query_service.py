from typing import Any, Dict, List, Optional
import uuid

from backend_service.app.domain.exceptions.base import EntityNotFoundException, ValidationException
from backend_service.app.domain.interfaces.conversation_repository import ConversationRepository
from backend_service.app.domain.interfaces.rag_client import RAGClientProtocol
from backend_service.app.domain.models.conversation import Conversation, Message, MessageRole


class QueryService:
    """
    Application service orchestrating multi-turn user conversation management,
    dispatching queries to the RAG client, and persisting messages and citations.
    """

    def __init__(
        self,
        conversation_repo: ConversationRepository,
        rag_client: RAGClientProtocol,
    ):
        self.conversation_repo = conversation_repo
        self.rag_client = rag_client

    async def execute_query(
        self,
        query_text: str,
        conversation_id: Optional[str] = None,
        service: str = "income-assessment-service",
        top_k: int = 5,
    ) -> Dict[str, Any]:
        cleaned_query = query_text.strip()
        if not cleaned_query:
            raise ValidationException("Query text cannot be empty.")

        # 1. Resolve or create conversation
        title_snippet = cleaned_query[:60] + ("..." if len(cleaned_query) > 60 else "")
        conversation = await self.conversation_repo.get_or_create_conversation(
            conversation_id=conversation_id,
            service=service,
            title=title_snippet,
        )

        # 2. Persist user message
        user_msg = Message(
            id=str(uuid.uuid4()),
            conversation_id=conversation.id,
            role=MessageRole.USER,
            content=cleaned_query,
        )
        await self.conversation_repo.add_message(conversation.id, user_msg)

        # 3. Retrieve prior conversation history for multi-turn context
        history = await self.conversation_repo.get_messages(conversation.id, limit=20)

        # 4. Dispatch query to RAG client
        rag_result = await self.rag_client.query(
            query_text=cleaned_query,
            service=service,
            history=history,
            top_k=top_k,
        )

        # 5. Persist assistant response with verified sources
        assistant_msg = Message(
            id=str(uuid.uuid4()),
            conversation_id=conversation.id,
            role=MessageRole.ASSISTANT,
            content=rag_result.answer,
            sources=rag_result.sources,
        )
        await self.conversation_repo.add_message(conversation.id, assistant_msg)

        # 6. Format response
        return {
            "conversation_id": conversation.id,
            "message_id": assistant_msg.id,
            "answer": rag_result.answer,
            "sources": [s.to_dict() for s in rag_result.sources],
            "service": rag_result.service,
            "latency_ms": rag_result.latency_ms,
            "provider": rag_result.provider,
            "model": rag_result.model,
            "created_at": assistant_msg.created_at.isoformat(),
        }

    async def get_conversation_history(self, conversation_id: str) -> Conversation:
        conversation = await self.conversation_repo.get_conversation(conversation_id)
        if not conversation:
            raise EntityNotFoundException("Conversation", conversation_id)
        return conversation

    async def list_conversations(
        self, service: Optional[str] = None, limit: int = 20
    ) -> List[Conversation]:
        return await self.conversation_repo.list_conversations(service=service, limit=limit)

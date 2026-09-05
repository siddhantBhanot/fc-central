from typing import List, Optional, Protocol
from backend_service.app.domain.models.conversation import Conversation, Message


class ConversationRepository(Protocol):
    """Abstract persistence interface for conversations and their messages."""

    async def get_or_create_conversation(
        self,
        conversation_id: Optional[str] = None,
        service: str = "income-assessment-service",
        title: Optional[str] = None,
        user_id: Optional[str] = None,
    ) -> Conversation:
        """Retrieve existing conversation by ID, or create a new conversation."""
        ...

    async def get_conversation(
        self,
        conversation_id: str,
        user_id: Optional[str] = None,
    ) -> Optional[Conversation]:
        """Retrieve a conversation and its messages by ID with user access check."""
        ...

    async def add_message(self, conversation_id: str, message: Message) -> Message:
        """Append a message to a conversation."""
        ...

    async def get_messages(self, conversation_id: str, limit: int = 50) -> List[Message]:
        """Retrieve the recent messages for a conversation ordered chronologically."""
        ...

    async def list_conversations(
        self,
        service: Optional[str] = None,
        limit: int = 20,
        user_id: Optional[str] = None,
    ) -> List[Conversation]:
        """List conversations, optionally filtered by microservice and user."""
        ...


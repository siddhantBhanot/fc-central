from functools import lru_cache
from typing import Optional

from backend_service.app.application.services.feedback_service import FeedbackService
from backend_service.app.application.services.knowledge_service import KnowledgeService
from backend_service.app.application.services.query_service import QueryService
from backend_service.app.domain.interfaces.conversation_repository import ConversationRepository
from backend_service.app.domain.interfaces.feedback_repository import FeedbackRepository
from backend_service.app.domain.interfaces.rag_client import RAGClientProtocol
from backend_service.app.infrastructure.clients.direct_rag_client import DirectRAGClient
from backend_service.app.infrastructure.clients.mock_rag_client import MockRAGClient
from backend_service.app.infrastructure.configuration.settings import Settings, get_settings
from backend_service.app.infrastructure.persistence.database import Database, get_database
from backend_service.app.infrastructure.persistence.sqlite_conversation_repo import SqliteConversationRepository
from backend_service.app.infrastructure.persistence.sqlite_feedback_repo import SqliteFeedbackRepository


@lru_cache
def get_db_instance() -> Database:
    return get_database()


@lru_cache
def get_conversation_repository() -> ConversationRepository:
    return SqliteConversationRepository(db=get_db_instance())


@lru_cache
def get_feedback_repository() -> FeedbackRepository:
    return SqliteFeedbackRepository(db=get_db_instance())


@lru_cache
def get_rag_client() -> RAGClientProtocol:
    settings = get_settings()
    if settings.rag_client_mode.lower() == "mock":
        return MockRAGClient()
    return DirectRAGClient()


def get_query_service() -> QueryService:
    return QueryService(
        conversation_repo=get_conversation_repository(),
        rag_client=get_rag_client(),
    )


def get_feedback_service() -> FeedbackService:
    return FeedbackService(
        feedback_repo=get_feedback_repository(),
    )


def get_knowledge_service() -> KnowledgeService:
    return KnowledgeService(
        rag_client=get_rag_client(),
    )

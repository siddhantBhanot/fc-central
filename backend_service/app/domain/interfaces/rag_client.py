from dataclasses import dataclass, field
from typing import List, Optional, Protocol
from backend_service.app.domain.models.conversation import Message, SourceCitation
from backend_service.app.domain.models.knowledge import IngestionJob


@dataclass
class RAGQueryResult:
    answer: str
    sources: List[SourceCitation] = field(default_factory=list)
    service: str = "income-assessment-service"
    latency_ms: float = 0.0
    provider: str = "unknown"
    model: str = "unknown"


class RAGClientProtocol(Protocol):
    """Abstract interface for RAG pipeline interactions."""

    async def query(
        self,
        query_text: str,
        service: str = "income-assessment-service",
        history: Optional[List[Message]] = None,
        top_k: int = 5,
    ) -> RAGQueryResult:
        """Execute a grounded RAG query with optional multi-turn conversation history."""
        ...

    async def trigger_ingestion(
        self,
        service: str = "income-assessment-service",
        source_directory: Optional[str] = None,
    ) -> IngestionJob:
        """Trigger document chunking, embedding, and vector upsertion for a service."""
        ...

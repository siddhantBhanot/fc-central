from dataclasses import dataclass, field
from typing import List, Optional, Protocol
from backend_service.app.domain.models.conversation import Message, SourceCitation
from backend_service.app.domain.models.knowledge import DocumentView, IngestionJob


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
        model: Optional[str] = None,
    ) -> RAGQueryResult:
        """Execute a grounded RAG query with optional multi-turn conversation history and model override."""
        ...

    async def list_models(self) -> List[dict]:
        """List configured LLM models available for runtime inference."""
        ...

    async def trigger_ingestion(
        self,
        service: str = "income-assessment-service",
        source_directory: Optional[str] = None,
    ) -> IngestionJob:
        """Trigger document chunking, embedding, and vector upsertion for a service."""
        ...

    async def get_document(
        self,
        service: str,
        file_path: str,
    ) -> DocumentView:
        """Safely retrieve full document content with path traversal and format protections."""
        ...

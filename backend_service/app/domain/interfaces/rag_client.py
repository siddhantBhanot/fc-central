from dataclasses import dataclass, field
from typing import Any, AsyncIterator, Dict, List, Optional, Protocol, Tuple
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

    async def stream_query(
        self,
        query_text: str,
        service: str = "income-assessment-service",
        history: Optional[List[Message]] = None,
        top_k: int = 5,
        model: Optional[str] = None,
    ) -> Tuple[AsyncIterator[str], List[SourceCitation], Dict[str, Any]]:
        """Stream chunks from RAG pipeline with upfront source citations and metadata."""
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

    async def list_courses(self) -> List[dict]:
        """List all available Knowledge Cafe courses."""
        ...

    async def get_course_detail(self, course_id: str) -> Optional[dict]:
        """Get full details of a course including creator-defined lessons and context metadata."""
        ...

    async def synthesize_lesson(
        self,
        course_id: str,
        lesson_id: str,
        previous_summary: Optional[str] = None,
        model: Optional[str] = None,
    ) -> dict:
        """Synthesize a complete pedagogical lesson grounded in dedicated lesson context files."""
        ...

    async def stream_synthesize_lesson(
        self,
        course_id: str,
        lesson_id: str,
        previous_summary: Optional[str] = None,
        model: Optional[str] = None,
    ) -> Tuple[AsyncIterator[str], List[SourceCitation], Dict[str, Any]]:
        """Stream progressive lesson synthesis tokens in real-time."""
        ...

    async def answer_doubt(
        self,
        course_id: str,
        lesson_id: str,
        question: str,
        lesson_content_snippet: str = "",
        model: Optional[str] = None,
    ) -> dict:
        """Answer an in-lesson question grounded in the lesson context files."""
        ...

    async def stream_answer_doubt(
        self,
        course_id: str,
        lesson_id: str,
        question: str,
        lesson_content_snippet: str = "",
        model: Optional[str] = None,
    ) -> Tuple[AsyncIterator[str], List[SourceCitation], Dict[str, Any]]:
        """Stream in-lesson doubt answering tokens in real-time."""
        ...

    async def get_course_document(
        self,
        course_id: str,
        file_path: str,
    ) -> DocumentView:
        """Safely retrieve full content of a course context document for View Source."""
        ...

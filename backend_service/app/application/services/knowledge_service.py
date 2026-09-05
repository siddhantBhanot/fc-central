from typing import Any, Dict, Optional
from backend_service.app.domain.exceptions.base import ValidationException
from backend_service.app.domain.interfaces.rag_client import RAGClientProtocol


class KnowledgeService:
    """Application service for triggering knowledge base ingestion jobs."""

    def __init__(self, rag_client: RAGClientProtocol):
        self.rag_client = rag_client

    async def trigger_ingestion(
        self,
        service: str = "income-assessment-service",
        source_directory: Optional[str] = None,
    ) -> Dict[str, Any]:
        cleaned_service = service.strip()
        if not cleaned_service:
            raise ValidationException("service identifier cannot be empty.")

        job = await self.rag_client.trigger_ingestion(
            service=cleaned_service,
            source_directory=source_directory,
        )

        return {
            "job_id": job.id,
            "service": job.service,
            "status": job.status.value,
            "source_path": job.source_path,
            "total_files": job.total_files,
            "total_chunks": job.total_chunks,
            "files_indexed": job.files_indexed,
            "error_message": job.error_message,
            "created_at": job.created_at.isoformat(),
            "completed_at": job.completed_at.isoformat() if job.completed_at else None,
        }

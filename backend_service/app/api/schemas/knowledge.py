from typing import List, Optional
from pydantic import BaseModel, Field


class KnowledgeIngestRequest(BaseModel):
    service: str = Field(
        default="income-assessment-service",
        description="Target microservice identifier",
    )
    source_path: Optional[str] = Field(
        default=None,
        description="Optional local filesystem path to ingest; defaults to service sample data directory",
    )


class KnowledgeIngestResponse(BaseModel):
    job_id: str = Field(..., description="Unique ingestion job identifier")
    service: str = Field(..., description="Target microservice identifier")
    status: str = Field(..., description="Job status: pending, processing, completed, failed")
    source_path: str = Field(..., description="Resolved directory path scanned for ingestion")
    total_files: int = Field(default=0, description="Total number of markdown and code files ingested")
    total_chunks: int = Field(default=0, description="Total number of semantic chunks indexed")
    files_indexed: List[str] = Field(default_factory=list, description="List of file names indexed")
    error_message: Optional[str] = Field(default=None, description="Error explanation if status is failed")
    created_at: str
    completed_at: Optional[str] = None

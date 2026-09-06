import asyncio
from datetime import datetime, timezone
from pathlib import Path
import sys
import time
from typing import List, Optional
import uuid

# Ensure project root is in sys.path
_project_root = Path(__file__).resolve().parents[4]
if str(_project_root) not in sys.path:
    sys.path.insert(0, str(_project_root))

from backend_service.app.domain.exceptions.base import RAGServiceException
from backend_service.app.domain.interfaces.rag_client import RAGClientProtocol, RAGQueryResult
from backend_service.app.domain.models.conversation import Message, SourceCitation
from backend_service.app.domain.models.knowledge import IngestionJob, IngestionStatus


class DirectRAGClient(RAGClientProtocol):
    """
    Direct adapter invoking the verified rag_service pipeline in-process.
    Provides complete multi-turn grounded retrieval using Groq/OpenAI/Bedrock and Qdrant.
    """

    def __init__(self):
        self._pipeline = None
        self._ingestion = None
        self._init_rag()

    def _init_rag(self) -> None:
        try:
            from rag_service.infrastructure.config import get_settings as get_rag_settings
            from rag_service.infrastructure.providers.bedrock_embedding import BedrockEmbeddingProvider
            from rag_service.infrastructure.providers.bedrock_llm import BedrockLLMProvider
            from rag_service.infrastructure.providers.openai_llm import OpenAiClientProvider
            from rag_service.infrastructure.providers.qdrant_embedding import QdrantEmbeddingProvider
            from rag_service.infrastructure.providers.qdrant_store import QdrantVectorStoreAdapter
            from rag_service.ingestion.pipeline import IngestionPipeline
            from rag_service.pipeline.rag_engine import RAGPipeline
            from rag_service.prompts.loader import PromptLoader

            settings = get_rag_settings()
            has_aws = bool(settings.aws_access_key_id and settings.aws_secret_access_key)
            has_openai = bool(settings.openai_api_key)

            # Embedder
            if has_aws:
                embedding_provider = BedrockEmbeddingProvider(settings)
            else:
                embedding_provider = QdrantEmbeddingProvider(settings)

            # Vector Store
            settings.embedding_dimension = embedding_provider.dimension
            vector_store = QdrantVectorStoreAdapter(settings)

            # LLM Provider
            if has_aws:
                llm_provider = BedrockLLMProvider(settings)
            elif has_openai:
                llm_provider = OpenAiClientProvider(settings)
            else:
                # Standalone fallback if neither is present
                from rag_service.run_local import LocalSimulatedLLM
                llm_provider = LocalSimulatedLLM()

            prompts_dir = _project_root / "rag_service" / "prompts"
            prompt_loader = PromptLoader(prompts_dir=prompts_dir)

            self._pipeline = RAGPipeline(
                vector_store=vector_store,
                embedding_provider=embedding_provider,
                llm_provider=llm_provider,
                prompt_loader=prompt_loader,
                default_service=settings.default_microservice,
                max_history_messages=settings.max_history_messages,
            )

            self._ingestion = IngestionPipeline(
                vector_store=vector_store,
                embedding_provider=embedding_provider,
                default_service=settings.default_microservice,
            )
        except Exception as e:
            self._pipeline = None
            self._ingestion = None

    async def query(
        self,
        query_text: str,
        service: str = "income-assessment-service",
        history: Optional[List[Message]] = None,
        top_k: int = 5,
    ) -> RAGQueryResult:
        if self._pipeline is None:
            self._init_rag()
        if self._pipeline is None:
            raise RAGServiceException(
                "RAG pipeline could not be initialized. Please check rag_service dependencies and configuration."
            )

        try:
            # Map conversation history to RAG Message models
            from rag_service.domain.models import Message as RAGMessage
            rag_history = []
            if history:
                for m in history:
                    rag_history.append(RAGMessage(role=m.role.value, content=m.content))

            result = await self._pipeline.query(
                query_text=query_text,
                service=service,
                chat_history=rag_history if rag_history else None,
                top_k=top_k,
            )

            # Map source references back to domain SourceCitation
            citations = []
            for src in result.sources:
                doc_type_val = getattr(src, "document_type", getattr(src, "doc_type", "markdown"))
                snippet_val = getattr(src, "snippet", getattr(src, "content_snippet", None))
                citations.append(
                    SourceCitation(
                        file=src.file,
                        class_name=src.class_name,
                        endpoint=src.endpoint,
                        start_line=src.start_line,
                        end_line=src.end_line,
                        doc_type=doc_type_val.value if hasattr(doc_type_val, "value") else str(doc_type_val),
                        snippet=snippet_val,
                    )
                )

            return RAGQueryResult(
                answer=result.answer,
                sources=citations,
                service=result.service,
                latency_ms=result.latency_ms,
                provider=result.provider,
                model=result.model,
            )
        except Exception as e:
            raise RAGServiceException(f"Error querying RAG pipeline: {e}", details={"error": str(e)}) from e

    async def trigger_ingestion(
        self,
        service: str = "income-assessment-service",
        source_directory: Optional[str] = None,
    ) -> IngestionJob:
        if self._ingestion is None:
            self._init_rag()
        if self._ingestion is None:
            raise RAGServiceException("RAG Ingestion pipeline could not be initialized.")

        target_dir = (
            Path(source_directory)
            if source_directory
            else _project_root / "rag_service" / "sample_data" / service
        )

        job = IngestionJob(
            id=str(uuid.uuid4()),
            service=service,
            source_path=str(target_dir),
            status=IngestionStatus.PROCESSING,
        )

        try:
            if not target_dir.exists():
                job.status = IngestionStatus.FAILED
                job.error_message = f"Source directory '{target_dir}' does not exist."
                job.completed_at = datetime.now(timezone.utc)
                return job

            ingest_result = await self._ingestion.ingest_directory(target_dir, service=service)
            job.total_files = ingest_result.get("total_files", 0)
            job.total_chunks = ingest_result.get("total_chunks", 0)
            job.files_indexed = [Path(f).name for f in ingest_result.get("files", [])]
            job.status = IngestionStatus.COMPLETED
            job.completed_at = datetime.now(timezone.utc)
            return job
        except Exception as e:
            job.status = IngestionStatus.FAILED
            job.error_message = str(e)
            job.completed_at = datetime.now(timezone.utc)
            return job

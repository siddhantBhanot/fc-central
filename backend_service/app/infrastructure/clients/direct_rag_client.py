import asyncio
from datetime import datetime, timezone
from pathlib import Path
import sys
import time
from typing import Any, AsyncIterator, Dict, List, Optional, Tuple
import uuid

# Ensure project root is in sys.path
_project_root = Path(__file__).resolve().parents[4]
if str(_project_root) not in sys.path:
    sys.path.insert(0, str(_project_root))

from backend_service.app.domain.exceptions.base import (
    DomainException,
    RAGServiceException,
    ValidationException,
)
from backend_service.app.domain.interfaces.rag_client import RAGClientProtocol, RAGQueryResult
from backend_service.app.domain.models.conversation import Message, SourceCitation
from backend_service.app.domain.models.knowledge import DocumentView, IngestionJob, IngestionStatus


class DirectRAGClient(RAGClientProtocol):
    """
    Direct adapter invoking the verified rag_service pipeline in-process.
    Provides complete multi-turn grounded retrieval using Groq/OpenAI/Bedrock and Qdrant.
    """

    def __init__(self):
        self._pipeline = None
        self._ingestion = None
        self._kt_engine = None
        self._course_indexer = None
        self._kt_indexed = False
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

            from rag_service.infrastructure.providers.qdrant_store import QdrantVectorStoreAdapter
            from rag_service.knowledge_cafe.kt_engine import KTEngine
            from rag_service.knowledge_cafe.course_indexer import CourseIndexer

            kt_vector_store = QdrantVectorStoreAdapter(
                settings=settings,
                collection_name=settings.qdrant_kt_collection_name,
            )
            self._kt_engine = KTEngine(
                llm_provider=llm_provider,
                prompt_loader=prompt_loader,
                kt_vector_store=kt_vector_store,
                embedding_provider=embedding_provider,
            )
            self._course_indexer = CourseIndexer(
                vector_store=kt_vector_store,
                embedding_provider=embedding_provider,
            )
        except Exception as e:
            self._pipeline = None
            self._ingestion = None
            self._kt_engine = None
            self._course_indexer = None

    def _ensure_initialized(self):
        if self._pipeline is None or self._kt_engine is None:
            self._init_rag()
        if self._pipeline is None:
            raise RAGServiceException(
                "RAG pipeline could not be initialized. Please check rag_service dependencies and configuration."
            )

    async def list_models(self) -> List[dict]:
        """Discover available LLM models strictly based on active server configuration."""
        from rag_service.infrastructure.config import get_settings
        settings = get_settings()

        has_groq = bool(settings.groq_api_key)
        has_openai = bool(settings.openai_api_key)
        has_aws = bool(settings.aws_access_key_id and settings.aws_secret_access_key)

        default_model = settings.openai_model_id if (has_groq or has_openai) else settings.bedrock_llm_model_id

        if has_groq or (has_openai and "groq" in (settings.openai_base_url or "").lower()):
            return [
                {
                    "id": "openai/gpt-oss-120b",
                    "name": "GPT-OSS 120B",
                    "provider": "groq",
                    "description": "High-capacity open-weight reasoning model via Groq",
                    "is_default": default_model == "openai/gpt-oss-120b",
                },
                {
                    "id": "openai/gpt-oss-20b",
                    "name": "GPT-OSS 20B",
                    "provider": "groq",
                    "description": "Fast low-latency open-weight reasoning model",
                    "is_default": default_model == "openai/gpt-oss-20b",
                },
                {
                    "id": "qwen/qwen3.8-27b",
                    "name": "Qwen 3.8 27B",
                    "provider": "groq",
                    "description": "Advanced multilingual reasoning model",
                    "is_default": default_model == "qwen/qwen3.8-27b",
                },
                {
                    "id": "qwen/qwen3.6-27b",
                    "name": "Qwen 3.6 27B",
                    "provider": "groq",
                    "description": "High-speed analytical reasoning model",
                    "is_default": default_model == "qwen/qwen3.6-27b",
                },
                {
                    "id": "groq/compound",
                    "name": "Groq Compound",
                    "provider": "groq",
                    "description": "Groq optimized multi-turn reasoning engine",
                    "is_default": default_model == "groq/compound",
                },
                {
                    "id": "groq/compound-mini",
                    "name": "Groq Compound Mini",
                    "provider": "groq",
                    "description": "Ultra-fast low-latency inference engine",
                    "is_default": default_model == "groq/compound-mini",
                },
            ]
        elif has_openai:
            return [
                {
                    "id": "gpt-4o",
                    "name": "GPT-4o",
                    "provider": "openai",
                    "description": "OpenAI flagship omni-model",
                    "is_default": default_model == "gpt-4o",
                },
                {
                    "id": "gpt-4o-mini",
                    "name": "GPT-4o Mini",
                    "provider": "openai",
                    "description": "Fast and efficient OpenAI model",
                    "is_default": default_model == "gpt-4o-mini",
                },
            ]
        elif has_aws:
            return [
                {
                    "id": "anthropic.claude-3-5-sonnet-20240620-v1:0",
                    "name": "Claude 3.5 Sonnet",
                    "provider": "bedrock",
                    "description": "High-intelligence AWS Bedrock Claude model",
                    "is_default": default_model == "anthropic.claude-3-5-sonnet-20240620-v1:0",
                },
                {
                    "id": "anthropic.claude-3-haiku-20240307-v1:0",
                    "name": "Claude 3 Haiku",
                    "provider": "bedrock",
                    "description": "Fast and lightweight AWS Bedrock model",
                    "is_default": default_model == "anthropic.claude-3-haiku-20240307-v1:0",
                },
            ]
        else:
            return [
                {
                    "id": "local-simulated-engine",
                    "name": "Local Simulated LLM",
                    "provider": "local",
                    "description": "Simulated local offline inference",
                    "is_default": True,
                }
            ]

    async def query(
        self,
        query_text: str,
        service: str = "income-assessment-service",
        history: Optional[List[Message]] = None,
        top_k: int = 5,
        model: Optional[str] = None,
    ) -> RAGQueryResult:
        if self._pipeline is None:
            self._init_rag()
        if self._pipeline is None:
            raise RAGServiceException(
                "RAG pipeline could not be initialized. Please check rag_service dependencies and configuration."
            )

        # Validate requested model if explicitly provided
        if model:
            available = await self.list_models()
            valid_ids = {m["id"] for m in available}
            if model not in valid_ids:
                from backend_service.app.domain.exceptions.base import ValidationException
                raise ValidationException(
                    f"Model '{model}' is not available or configured. Available models: {', '.join(sorted(valid_ids))}"
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
                model=model,
            )

            # Map source references back to domain SourceCitation
            citations = []
            for src in result.sources:
                doc_type_val = getattr(src, "document_type", getattr(src, "doc_type", "markdown"))
                snippet_val = getattr(src, "snippet", getattr(src, "content_snippet", None))
                citations.append(
                    SourceCitation(
                        file=src.file,
                        service=getattr(src, "service", None) or result.service,
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
        except DomainException:
            raise
        except Exception as e:
            raise RAGServiceException(f"Error querying RAG pipeline: {e}", details={"error": str(e)}) from e

    async def stream_query(
        self,
        query_text: str,
        service: str = "income-assessment-service",
        history: Optional[List[Message]] = None,
        top_k: int = 5,
        model: Optional[str] = None,
    ) -> Tuple[AsyncIterator[str], List[SourceCitation], Dict[str, Any]]:
        """Stream chunks from RAG pipeline with upfront source citations and metadata."""
        self._ensure_initialized()

        if model:
            available_models = await self.list_models()
            valid_ids = {m["id"] for m in available_models}
            if model not in valid_ids:
                from backend_service.app.domain.exceptions.base import ValidationException
                raise ValidationException(
                    f"Model '{model}' is not available or configured. Available models: {', '.join(sorted(valid_ids))}"
                )

        try:
            from rag_service.domain.models import Message as RAGMessage
            rag_history = []
            if history:
                for m in history:
                    rag_history.append(RAGMessage(role=m.role.value, content=m.content))

            stream_iter, sources, meta = await self._pipeline.stream_query(
                query_text=query_text,
                service=service,
                chat_history=rag_history if rag_history else None,
                top_k=top_k,
                model=model,
            )

            citations = []
            for src in sources:
                doc_type_val = getattr(src, "document_type", getattr(src, "doc_type", "markdown"))
                snippet_val = getattr(src, "snippet", getattr(src, "content_snippet", None))
                citations.append(
                    SourceCitation(
                        file=src.file,
                        service=getattr(src, "service", None) or service,
                        class_name=src.class_name,
                        endpoint=src.endpoint,
                        start_line=src.start_line,
                        end_line=src.end_line,
                        doc_type=doc_type_val.value if hasattr(doc_type_val, "value") else str(doc_type_val),
                        snippet=snippet_val,
                    )
                )

            return stream_iter, citations, meta
        except DomainException:
            raise
        except Exception as e:
            raise RAGServiceException(f"Error in streaming RAG pipeline: {e}", details={"error": str(e)}) from e

    async def get_document(
        self,
        service: str,
        file_path: str,
    ) -> DocumentView:
        from rag_service.infrastructure.document_reader import DocumentReader
        from backend_service.app.domain.models.knowledge import DocumentView

        sample_dir = _project_root / "rag_service" / "sample_data"
        reader = DocumentReader(data_dir=sample_dir)
        doc = reader.read_document(service=service, file_path=file_path)
        return DocumentView(
            file=doc.file,
            service=doc.service,
            content=doc.content,
            content_type=doc.content_type,
            total_lines=doc.total_lines,
            size_bytes=doc.size_bytes,
        )

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

    async def _ensure_kt_indexed(self):
        if not self._kt_indexed and self._course_indexer:
            self._kt_indexed = True
            try:
                import asyncio
                asyncio.create_task(self._course_indexer.index_all_courses())
            except Exception as e:
                logger.warning(f"Failed to trigger async KT course indexing: {e}")

    async def list_courses(self) -> List[dict]:
        if self._kt_engine is None:
            self._init_rag()
        if self._kt_engine is None:
            return []
        await self._ensure_kt_indexed()
        return self._kt_engine.list_courses()

    async def get_course_detail(self, course_id: str) -> Optional[dict]:
        if self._kt_engine is None:
            self._init_rag()
        if self._kt_engine is None:
            return None
        return self._kt_engine.get_course_detail(course_id)

    async def synthesize_lesson(
        self,
        course_id: str,
        lesson_id: str,
        previous_summary: Optional[str] = None,
        model: Optional[str] = None,
    ) -> dict:
        if self._kt_engine is None:
            self._init_rag()
        if self._kt_engine is None:
            raise RAGServiceException("Knowledge Cafe engine could not be initialized.")
        try:
            return await self._kt_engine.synthesize_lesson(
                course_id=course_id,
                lesson_id=lesson_id,
                previous_summary=previous_summary,
                model=model,
            )
        except ValueError as ve:
            from backend_service.app.domain.exceptions.base import EntityNotFoundException
            raise EntityNotFoundException(entity_name="Course/Lesson", entity_id=f"{course_id}/{lesson_id}") from ve
        except Exception as e:
            raise RAGServiceException(f"Error synthesizing lesson: {e}") from e

    async def stream_synthesize_lesson(
        self,
        course_id: str,
        lesson_id: str,
        previous_summary: Optional[str] = None,
        model: Optional[str] = None,
    ) -> Tuple[AsyncIterator[str], List[SourceCitation], Dict[str, Any]]:
        if self._kt_engine is None:
            self._init_rag()
        if self._kt_engine is None:
            raise RAGServiceException("Knowledge Cafe engine could not be initialized.")
        try:
            stream_iter, raw_sources, meta = await self._kt_engine.stream_synthesize_lesson(
                course_id=course_id,
                lesson_id=lesson_id,
                previous_summary=previous_summary,
                model=model,
            )
            citations = [
                SourceCitation(
                    file=s.get("file", ""),
                    service=s.get("service"),
                    doc_type=s.get("doc_type", "course_context"),
                    snippet=s.get("snippet"),
                )
                for s in raw_sources
            ]
            return stream_iter, citations, meta
        except Exception as e:
            raise RAGServiceException(f"Error in stream synthesizing lesson: {e}") from e

    async def answer_doubt(
        self,
        course_id: str,
        lesson_id: str,
        question: str,
        lesson_content_snippet: str = "",
        model: Optional[str] = None,
    ) -> dict:
        if self._kt_engine is None:
            self._init_rag()
        if self._kt_engine is None:
            raise RAGServiceException("Knowledge Cafe engine could not be initialized.")
        try:
            return await self._kt_engine.answer_doubt(
                course_id=course_id,
                lesson_id=lesson_id,
                question=question,
                lesson_content_snippet=lesson_content_snippet,
                model=model,
            )
        except Exception as e:
            raise RAGServiceException(f"Error answering lesson doubt: {e}") from e

    async def stream_answer_doubt(
        self,
        course_id: str,
        lesson_id: str,
        question: str,
        lesson_content_snippet: str = "",
        model: Optional[str] = None,
    ) -> Tuple[AsyncIterator[str], List[SourceCitation], Dict[str, Any]]:
        if self._kt_engine is None:
            self._init_rag()
        if self._kt_engine is None:
            raise RAGServiceException("Knowledge Cafe engine could not be initialized.")
        try:
            stream_iter, raw_sources, meta = await self._kt_engine.stream_answer_doubt(
                course_id=course_id,
                lesson_id=lesson_id,
                question=question,
                lesson_content_snippet=lesson_content_snippet,
                model=model,
            )
            citations = [
                SourceCitation(
                    file=s.get("file", ""),
                    service=s.get("service"),
                    doc_type=s.get("doc_type", "course_context"),
                    snippet=s.get("snippet"),
                )
                for s in raw_sources
            ]
            return stream_iter, citations, meta
        except Exception as e:
            raise RAGServiceException(f"Error in streaming answer doubt: {e}") from e

    async def get_course_document(
        self,
        course_id: str,
        file_path: str,
    ) -> DocumentView:
        if self._kt_engine is None:
            self._init_rag()
        if self._kt_engine is None:
            raise RAGServiceException("Knowledge Cafe engine could not be initialized.")
        try:
            name, content = self._kt_engine.read_document(course_id, file_path)
            total_lines = len(content.splitlines())
            size_bytes = len(content.encode("utf-8"))
            return DocumentView(
                file=name,
                service=course_id,
                content=content,
                content_type="text/markdown",
                total_lines=total_lines,
                size_bytes=size_bytes,
            )
        except FileNotFoundError as fe:
            from backend_service.app.domain.exceptions.base import EntityNotFoundException
            raise EntityNotFoundException(entity_name="CourseDocument", entity_id=file_path) from fe
        except PermissionError as pe:
            from backend_service.app.domain.exceptions.base import ForbiddenException
            raise ForbiddenException(str(pe)) from pe

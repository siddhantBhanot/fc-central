import asyncio
from datetime import datetime, timezone
from typing import List, Optional
import uuid

from backend_service.app.domain.interfaces.rag_client import RAGClientProtocol, RAGQueryResult
from backend_service.app.domain.models.conversation import Message, SourceCitation
from backend_service.app.domain.models.knowledge import IngestionJob, IngestionStatus


class MockRAGClient(RAGClientProtocol):
    """
    Mock adapter for testing and offline environments.
    Simulates grounded RAG responses and ingestion jobs without external network calls.
    """

    async def query(
        self,
        query_text: str,
        service: str = "income-assessment-service",
        history: Optional[List[Message]] = None,
        top_k: int = 5,
    ) -> RAGQueryResult:
        await asyncio.sleep(0.05)  # Simulate brief processing latency

        # Grounded-style simulated response
        answer = (
            f"### Assessment Analysis for `{service}`\n\n"
            f"Based on the indexed architecture and code contracts for **{service}**:\n\n"
            f"1. **Query Evaluated**: \"{query_text}\"\n"
            f"2. **Orchestration**: The request flows through Spring Boot REST Controllers into application domain services.\n"
            f"3. **Integration Anchors**: Interacts with downstream gateways (Zenith AA-Orch, Perfios, CAP) and emits telemetry.\n"
            f"4. **State Management**: Results are persisted to MongoDB and published to Kafka."
        )

        citations = [
            SourceCitation(
                file="01-architecture.md",
                doc_type="Markdown Documentation",
                start_line=1,
                end_line=45,
                snippet="Integration architecture and gateway orchestration overview.",
            ),
            SourceCitation(
                file="FourWheelerPersonalAssessmentHandler.kt",
                class_name="FourWheelerPersonalAssessmentHandler",
                endpoint="/api/v1/assess",
                start_line=23,
                end_line=40,
                doc_type="Kotlin Source",
                snippet="Business handler implementing POST /api/v1/assess",
            ),
        ]

        return RAGQueryResult(
            answer=answer,
            sources=citations,
            service=service,
            latency_ms=52.4,
            provider="mock-local",
            model="mock-gpt-oss",
        )

    async def trigger_ingestion(
        self,
        service: str = "income-assessment-service",
        source_directory: Optional[str] = None,
    ) -> IngestionJob:
        await asyncio.sleep(0.05)
        now = datetime.now(timezone.utc)
        return IngestionJob(
            id=str(uuid.uuid4()),
            service=service,
            source_path=source_directory or f"sample_data/{service}",
            status=IngestionStatus.COMPLETED,
            total_files=3,
            total_chunks=129,
            files_indexed=["00-overview.md", "01-architecture.md", "02-request-flows.md"],
            created_at=now,
            completed_at=now,
        )

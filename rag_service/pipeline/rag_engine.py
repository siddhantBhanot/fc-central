import time
from typing import Any, AsyncIterator, Dict, List, Optional, Tuple

from rag_service.domain.models import (
    Chunk,
    Message,
    MessageRole,
    QueryResult,
    SourceReference,
)
from rag_service.domain.protocols import EmbeddingProvider, LLMProvider, VectorStore
from rag_service.prompts.loader import PromptLoader, get_prompt_loader


class ContextAssembler:
    """
    Assembles retrieved chunks into structured context text and
    extracts verified source citations.
    """

    @staticmethod
    def assemble(chunks: List[Chunk]) -> Tuple[str, List[SourceReference]]:
        if not chunks:
            return "No matching documentation or source code found for the query.", []

        context_blocks: List[str] = []
        sources: List[SourceReference] = []
        seen_files = set()

        for idx, chunk in enumerate(chunks, start=1):
            meta = chunk.metadata
            file_ref = meta.file_path

            # Format source reference
            source = SourceReference(
                file=file_ref,
                document_type=meta.document_type.value,
                class_name=meta.class_name,
                method_name=meta.method_name,
                endpoint=meta.endpoint,
                start_line=meta.start_line,
                end_line=meta.end_line,
                snippet=chunk.content[:200] + "..." if len(chunk.content) > 200 else chunk.content,
            )
            if file_ref not in seen_files:
                sources.append(source)
                seen_files.add(file_ref)

            header_info = f"[Source {idx}: {file_ref}"
            if meta.class_name:
                header_info += f" | Class: {meta.class_name}"
            if meta.method_name:
                header_info += f" | Method: {meta.method_name}"
            if meta.endpoint:
                header_info += f" | Endpoint: {meta.endpoint}"
            header_info += "]"

            context_blocks.append(f"{header_info}\n{chunk.content}\n")

        return "\n---------------------\n".join(context_blocks), sources


class RAGPipeline:
    """
    Retrieval-Augmented Generation pipeline.
    Orchestrates query processing, metadata filtering, semantic retrieval,
    context assembly, prompt construction, and LLM generation.
    """

    def __init__(
        self,
        vector_store: VectorStore,
        embedding_provider: EmbeddingProvider,
        llm_provider: LLMProvider,
        prompt_loader: Optional[PromptLoader] = None,
        default_service: str = "income-assessment-service",
    ) -> None:
        self.vector_store = vector_store
        self.embedding_provider = embedding_provider
        self.llm_provider = llm_provider
        self.prompt_loader = prompt_loader or get_prompt_loader()
        self.default_service = default_service
        self.context_assembler = ContextAssembler()

    async def query(
        self,
        query_text: str,
        service: Optional[str] = None,
        chat_history: Optional[List[Message]] = None,
        top_k: int = 4,
        temperature: float = 0.1,
    ) -> QueryResult:
        """
        Execute full RAG query workflow.
        """
        start_time = time.perf_counter()
        target_service = service or self.default_service

        # 1. Embed query
        query_vector = await self.embedding_provider.embed_query(query_text)

        # 2. Retrieve with service-level filtering
        retrieved_chunks = await self.vector_store.search(
            query_vector=query_vector,
            limit=top_k,
            service_filter=target_service,
        )

        # 3. Assemble Context & Citations
        context_str, sources = self.context_assembler.assemble(retrieved_chunks)

        # 4. Format Conversation History
        formatted_history = ""
        if chat_history:
            history_lines = [f"{m.role.value.capitalize()}: {m.content}" for m in chat_history[-6:]]
            formatted_history = "\n".join(history_lines)
        else:
            formatted_history = "None"

        # 5. Render Prompts
        system_prompt = self.prompt_loader.render("system", service=target_service)
        query_prompt = self.prompt_loader.render(
            "query_answer",
            service=target_service,
            context_str=context_str,
            chat_history=formatted_history,
            query_str=query_text,
        )

        messages = [Message(role=MessageRole.USER, content=query_prompt)]

        # 6. LLM Generation
        llm_response = await self.llm_provider.generate(
            messages=messages,
            system_prompt=system_prompt,
            temperature=temperature,
        )

        latency_ms = (time.perf_counter() - start_time) * 1000

        return QueryResult(
            answer=llm_response.content,
            service=target_service,
            sources=sources,
            provider=llm_response.provider,
            model=llm_response.model,
            latency_ms=round(latency_ms, 2),
            retrieved_chunks_count=len(retrieved_chunks),
        )

    async def stream_query(
        self,
        query_text: str,
        service: Optional[str] = None,
        chat_history: Optional[List[Message]] = None,
        top_k: int = 4,
        temperature: float = 0.1,
    ) -> Tuple[AsyncIterator[str], List[SourceReference]]:
        """
        Stream RAG response chunks asynchronously with upfront source metadata.
        """
        target_service = service or self.default_service

        # 1. Embed and retrieve
        query_vector = await self.embedding_provider.embed_query(query_text)
        retrieved_chunks = await self.vector_store.search(
            query_vector=query_vector,
            limit=top_k,
            service_filter=target_service,
        )

        # 2. Assemble context & sources
        context_str, sources = self.context_assembler.assemble(retrieved_chunks)

        formatted_history = "None"
        if chat_history:
            formatted_history = "\n".join(
                [f"{m.role.value.capitalize()}: {m.content}" for m in chat_history[-6:]]
            )

        system_prompt = self.prompt_loader.render("system", service=target_service)
        query_prompt = self.prompt_loader.render(
            "query_answer",
            service=target_service,
            context_str=context_str,
            chat_history=formatted_history,
            query_str=query_text,
        )

        messages = [Message(role=MessageRole.USER, content=query_prompt)]

        # 3. Stream from LLM provider
        stream_iter = self.llm_provider.stream(
            messages=messages,
            system_prompt=system_prompt,
            temperature=temperature,
        )

        return stream_iter, sources

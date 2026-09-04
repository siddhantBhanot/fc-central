from pathlib import Path
from typing import Any, Dict, List, Optional

from rag_service.domain.models import Chunk
from rag_service.domain.protocols import EmbeddingProvider, VectorStore
from rag_service.ingestion.chunkers.kotlin_chunker import KotlinChunker
from rag_service.ingestion.chunkers.markdown_chunker import MarkdownChunker


class IngestionPipeline:
    """
    Coordinates loading, semantic chunking, embedding generation,
    and vector store upsertion for engineering documentation and source code.
    """

    def __init__(
        self,
        vector_store: VectorStore,
        embedding_provider: EmbeddingProvider,
        default_service: str = "income-assessment-service",
    ) -> None:
        self.vector_store = vector_store
        self.embedding_provider = embedding_provider
        self.default_service = default_service
        self.md_chunker = MarkdownChunker(service=default_service)
        self.kt_chunker = KotlinChunker(service=default_service)

    async def ingest_file(
        self,
        file_path: Path | str,
        service: Optional[str] = None,
        source: str = "local",
        extra_metadata: Optional[Dict[str, Any]] = None,
    ) -> List[Chunk]:
        """
        Ingest a single Markdown or Kotlin file.
        """
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"File not found for ingestion: {path}")

        content = path.read_text(encoding="utf-8", errors="replace")
        target_service = service or self.default_service

        suffix = path.suffix.lower()
        if suffix in [".kt", ".kts"]:
            chunker = KotlinChunker(service=target_service)
            chunks = chunker.chunk(
                content=content,
                file_path=str(path),
                source=source,
                extra_metadata=extra_metadata,
            )
        elif suffix in [".md", ".markdown"]:
            chunker = MarkdownChunker(service=target_service)
            chunks = chunker.chunk(
                content=content,
                file_path=str(path),
                source=source,
                extra_metadata=extra_metadata,
            )
        else:
            # Default text chunking via markdown chunker
            chunker = MarkdownChunker(service=target_service)
            chunks = chunker.chunk(
                content=content,
                file_path=str(path),
                source=source,
                extra_metadata=extra_metadata,
            )

        if not chunks:
            return []

        # Batch embed chunk texts
        texts = [c.content for c in chunks]
        embeddings = await self.embedding_provider.embed(texts)

        for chunk, emb in zip(chunks, embeddings):
            chunk.embedding = emb

        # Upsert into vector store
        await self.vector_store.upsert(chunks)
        return chunks

    async def ingest_directory(
        self,
        directory_path: Path | str,
        service: Optional[str] = None,
        pattern: str = "**/*",
    ) -> Dict[str, Any]:
        """
        Recursively ingest all matching Kotlin and Markdown files in a directory.
        """
        dir_path = Path(directory_path)
        if not dir_path.is_dir():
            raise NotADirectoryError(f"Directory not found: {dir_path}")

        allowed_extensions = {".md", ".markdown", ".kt", ".kts"}
        total_chunks = 0
        ingested_files = []

        for p in dir_path.glob(pattern):
            if p.is_file() and p.suffix.lower() in allowed_extensions:
                chunks = await self.ingest_file(p, service=service)
                total_chunks += len(chunks)
                ingested_files.append(str(p))

        return {
            "service": service or self.default_service,
            "total_files": len(ingested_files),
            "total_chunks": total_chunks,
            "files": ingested_files,
        }

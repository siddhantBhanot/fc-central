import asyncio
import json
from typing import List, Optional

from rag_service.domain.protocols import EmbeddingProvider
from rag_service.infrastructure.config import Settings, get_settings


class BedrockEmbeddingProvider:
    """
    AWS Bedrock dense embedding provider conforming to EmbeddingProvider protocol.
    Bridges LlamaIndex BedrockEmbedding or direct boto3 bedrock-runtime.
    """

    def __init__(self, settings: Optional[Settings] = None) -> None:
        self.settings = settings or get_settings()
        self.model_id = self.settings.bedrock_embedding_model_id
        self.region = self.settings.aws_region
        self._dim = self.settings.embedding_dimension
        self._embed_model = None
        self._init_client()

    def _init_client(self) -> None:
        try:
            from llama_index.embeddings.bedrock import BedrockEmbedding

            kwargs = {
                "model_name": self.model_id,
                "region_name": self.region,
            }
            if self.settings.aws_access_key_id and self.settings.aws_secret_access_key:
                kwargs["aws_access_key_id"] = self.settings.aws_access_key_id
                kwargs["aws_secret_access_key"] = self.settings.aws_secret_access_key

            self._embed_model = BedrockEmbedding(**kwargs)
        except (ImportError, Exception):
            self._embed_model = None

    @property
    def dimension(self) -> int:
        return self._dim

    async def embed(self, texts: List[str]) -> List[List[float]]:
        """Compute dense vector embeddings for a list of strings."""
        if not texts:
            return []

        if self._embed_model is not None:
            try:
                return await self._embed_model.aget_text_embedding_batch(texts)
            except Exception as e:
                raise RuntimeError(f"Bedrock embedding error: {e}") from e

        # Direct boto3 fallback
        return await self._boto3_embed_batch(texts)

    async def embed_query(self, text: str) -> List[float]:
        """Compute embedding for a single query."""
        res = await self.embed([text])
        return res[0] if res else []

    async def _boto3_embed_batch(self, texts: List[str]) -> List[List[float]]:
        try:
            import boto3

            client = boto3.client(
                "bedrock-runtime",
                region_name=self.region,
                aws_access_key_id=self.settings.aws_access_key_id,
                aws_secret_access_key=self.settings.aws_secret_access_key,
            )

            loop = asyncio.get_running_loop()
            results: List[List[float]] = []

            for text in texts:
                # Titan text embedding v2 payload format
                payload = json.dumps({"inputText": text, "dimensions": self._dim})
                response = await loop.run_in_executor(
                    None,
                    lambda: client.invoke_model(
                        modelId=self.model_id,
                        body=payload,
                        contentType="application/json",
                        accept="application/json",
                    ),
                )
                body = json.loads(response["body"].read())
                embedding = body.get("embedding", [])
                results.append(embedding)

            return results
        except Exception as e:
            raise RuntimeError(f"Bedrock batch embedding failed: {e}") from e

import asyncio
import json
from typing import Any, AsyncIterator, List, Optional

from rag_service.domain.models import LLMResponse, Message, MessageRole
from rag_service.domain.protocols import LLMProvider
from rag_service.infrastructure.config import Settings, get_settings


class BedrockLLMProvider:
    """
    AWS Bedrock LLM Provider conforming to LLMProvider protocol.
    Bridges LlamaIndex Bedrock LLM integration and direct boto3 bedrock-runtime.
    """

    def __init__(self, settings: Optional[Settings] = None) -> None:
        self.settings = settings or get_settings()
        self.model_id = self.settings.bedrock_llm_model_id
        self.region = self.settings.aws_region
        self._llm = None
        self._init_client()

    def _init_client(self) -> None:
        try:
            from llama_index.llms.bedrock import Bedrock

            kwargs: dict[str, Any] = {
                "model": self.model_id,
                "region_name": self.region,
            }
            if self.settings.aws_access_key_id and self.settings.aws_secret_access_key:
                kwargs["aws_access_key_id"] = self.settings.aws_access_key_id
                kwargs["aws_secret_access_key"] = self.settings.aws_secret_access_key

            self._llm = Bedrock(**kwargs)
        except (ImportError, Exception):
            # Graceful fallback to direct boto3 runtime or mock when offline
            self._llm = None

    async def generate(
        self,
        messages: List[Message],
        system_prompt: Optional[str] = None,
        temperature: float = 0.1,
        max_tokens: int = 2048,
        **kwargs: Any,
    ) -> LLMResponse:
        """
        Generate text response through AWS Bedrock.
        """
        if self._llm is not None:
            try:
                from llama_index.core.base.llms.types import ChatMessage as LlamaChatMessage, MessageRole as LlamaRole

                llama_messages: List[LlamaChatMessage] = []
                if system_prompt:
                    llama_messages.append(LlamaChatMessage(role=LlamaRole.SYSTEM, content=system_prompt))

                for m in messages:
                    role = LlamaRole.USER if m.role == MessageRole.USER else LlamaRole.ASSISTANT
                    llama_messages.append(LlamaChatMessage(role=role, content=m.content))

                response = await self._llm.achat(llama_messages)
                return LLMResponse(
                    content=response.message.content or "",
                    model=self.model_id,
                    provider="bedrock",
                    metadata=response.raw if isinstance(response.raw, dict) else {},
                )
            except Exception as e:
                # Log or rethrow as controlled domain exception
                raise RuntimeError(f"Bedrock generation failed: {e}") from e

        # Fallback implementation using boto3 bedrock-runtime directly
        return await self._boto3_fallback_generate(messages, system_prompt, temperature, max_tokens)

    async def _boto3_fallback_generate(
        self,
        messages: List[Message],
        system_prompt: Optional[str],
        temperature: float,
        max_tokens: int,
    ) -> LLMResponse:
        try:
            import boto3

            client = boto3.client(
                "bedrock-runtime",
                region_name=self.region,
                aws_access_key_id=self.settings.aws_access_key_id,
                aws_secret_access_key=self.settings.aws_secret_access_key,
            )

            # Claude 3 Messages format
            formatted_messages = [{"role": m.role.value, "content": m.content} for m in messages if m.role != MessageRole.SYSTEM]
            payload: dict[str, Any] = {
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": max_tokens,
                "temperature": temperature,
                "messages": formatted_messages,
            }
            if system_prompt:
                payload["system"] = system_prompt

            loop = asyncio.get_running_loop()
            response = await loop.run_in_executor(
                None,
                lambda: client.invoke_model(
                    modelId=self.model_id,
                    body=json.dumps(payload),
                    contentType="application/json",
                    accept="application/json",
                ),
            )
            body = json.loads(response["body"].read())
            content = body.get("content", [{}])[0].get("text", "")
            return LLMResponse(
                content=content,
                model=self.model_id,
                provider="bedrock",
                metadata=body.get("usage", {}),
            )
        except Exception as e:
            raise RuntimeError(f"Bedrock invocation failed: {e}") from e

    async def stream(
        self,
        messages: List[Message],
        system_prompt: Optional[str] = None,
        temperature: float = 0.1,
        max_tokens: int = 2048,
        **kwargs: Any,
    ) -> AsyncIterator[str]:
        """Stream chunks of response text."""
        # For non-streaming fallback, yield full content as single chunk
        res = await self.generate(messages, system_prompt, temperature, max_tokens, **kwargs)
        yield res.content

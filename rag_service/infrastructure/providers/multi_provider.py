import logging
from typing import Any, AsyncIterator, Dict, List, Optional

from rag_service.domain.models import LLMResponse, Message
from rag_service.domain.protocols import LLMProvider

logger = logging.getLogger(__name__)


class MultiProviderLLMAdapter:
    """
    Multi-provider router conforming to LLMProvider protocol.
    Dynamically routes LLM generation and streaming requests to the correct
    provider (AWS Bedrock, Groq, OpenAI) based on the requested model ID.
    """

    def __init__(
        self,
        default_provider: LLMProvider,
        providers: Optional[Dict[str, LLMProvider]] = None,
        model_to_provider: Optional[Dict[str, str]] = None,
    ) -> None:
        self.default_provider = default_provider
        self.providers: Dict[str, LLMProvider] = providers or {}
        self.model_to_provider: Dict[str, str] = model_to_provider or {}

    def register_provider(self, name: str, provider: LLMProvider) -> None:
        self.providers[name] = provider

    def register_model(self, model_id: str, provider_name: str) -> None:
        self.model_to_provider[model_id] = provider_name

    def _resolve_provider(self, model: Optional[str]) -> LLMProvider:
        """Resolve appropriate underlying LLMProvider for a given model ID."""
        if not model:
            return self.default_provider

        # 1. Exact match in registered model map
        if model in self.model_to_provider:
            p_name = self.model_to_provider[model]
            if p_name in self.providers:
                return self.providers[p_name]

        # 2. Explicit prefix match (e.g. bedrock/model-id)
        if model.startswith("bedrock/") and "bedrock" in self.providers:
            return self.providers["bedrock"]
        if (model.startswith("groq/") or model.startswith("openai/")) and "groq" in self.providers:
            return self.providers["groq"]

        # 3. Known model family heuristics
        lower_model = model.lower()
        if any(prefix in lower_model for prefix in ["anthropic.claude", "amazon.nova", "amazon.titan", "qwen3-235b", "235b"]):
            if "bedrock" in self.providers:
                return self.providers["bedrock"]

        if any(prefix in lower_model for prefix in ["gpt-oss", "qwen3.8", "qwen3.6", "compound", "llama-3"]):
            if "groq" in self.providers:
                return self.providers["groq"]

        # Fallback to default configured provider
        return self.default_provider

    async def generate(
        self,
        messages: List[Message],
        system_prompt: Optional[str] = None,
        temperature: float = 0.1,
        max_tokens: int = 2048,
        model: Optional[str] = None,
        **kwargs: Any,
    ) -> LLMResponse:
        provider = self._resolve_provider(model)
        return await provider.generate(
            messages=messages,
            system_prompt=system_prompt,
            temperature=temperature,
            max_tokens=max_tokens,
            model=model,
            **kwargs,
        )

    async def stream(
        self,
        messages: List[Message],
        system_prompt: Optional[str] = None,
        temperature: float = 0.1,
        max_tokens: int = 2048,
        model: Optional[str] = None,
        **kwargs: Any,
    ) -> AsyncIterator[str]:
        provider = self._resolve_provider(model)
        async for chunk in provider.stream(
            messages=messages,
            system_prompt=system_prompt,
            temperature=temperature,
            max_tokens=max_tokens,
            model=model,
            **kwargs,
        ):
            yield chunk

import os
from pathlib import Path
from typing import Optional
from pydantic import Field

try:
    from dotenv import load_dotenv
    # Search for .env in current working dir, rag_service package dir, and parent dirs
    _possible_env_paths = [
        Path.cwd() / ".env",
        Path.cwd() / "rag_service" / ".env",
        Path(__file__).resolve().parent.parent / ".env",
        Path(__file__).resolve().parent.parent.parent / ".env",
    ]
    for _p in _possible_env_paths:
        if _p.is_file():
            load_dotenv(_p, override=False)
except ImportError:
    pass

try:
    from pydantic_settings import BaseSettings, SettingsConfigDict
    _HAS_SETTINGS = True
except ImportError:
    from pydantic import BaseModel as BaseSettings  # type: ignore
    SettingsConfigDict = dict  # type: ignore
    _HAS_SETTINGS = False


class Settings(BaseSettings):
    """
    RAG Service centralized configuration.
    All credentials and endpoint URLs are externalized through environment variables.
    """
    if _HAS_SETTINGS:
        model_config = SettingsConfigDict(
            env_file=[".env", "rag_service/.env"],
            env_file_encoding="utf-8",
            extra="ignore",
        )

    # Provider Selection
    llm_provider: str = Field(
        default_factory=lambda: os.getenv(
            "LLM_PROVIDER",
            "openai" if (os.getenv("GROQ_API_KEY") or os.getenv("OPENAI_API_KEY")) else "bedrock",
        )
    )
    embedding_provider: str = Field(
        default_factory=lambda: os.getenv(
            "EMBEDDING_PROVIDER",
            "bedrock" if (os.getenv("AWS_ACCESS_KEY_ID") and os.getenv("AWS_SECRET_ACCESS_KEY")) else "qdrant",
        )
    )
    vector_store_type: str = Field(default_factory=lambda: os.getenv("VECTOR_STORE", "qdrant"))

    # AWS Bedrock Settings
    aws_region: str = Field(default_factory=lambda: os.getenv("AWS_REGION", "us-east-1"))
    aws_access_key_id: Optional[str] = Field(default_factory=lambda: os.getenv("AWS_ACCESS_KEY_ID"))
    aws_secret_access_key: Optional[str] = Field(default_factory=lambda: os.getenv("AWS_SECRET_ACCESS_KEY"))
    bedrock_llm_model_id: str = Field(
        default_factory=lambda: os.getenv("BEDROCK_LLM_MODEL_ID", "anthropic.claude-3-5-sonnet-20240620-v1:0")
    )
    bedrock_embedding_model_id: str = Field(
        default_factory=lambda: os.getenv("BEDROCK_EMBEDDING_MODEL_ID", "amazon.titan-embed-text-v2:0")
    )

    # OpenAI / Groq / OpenAI-Compatible Settings
    groq_api_key: Optional[str] = Field(default_factory=lambda: os.getenv("GROQ_API_KEY"))
    openai_api_key: Optional[str] = Field(
        default_factory=lambda: os.getenv("GROQ_API_KEY") or os.getenv("OPENAI_API_KEY")
    )
    openai_base_url: str = Field(
        default_factory=lambda: os.getenv(
            "OPENAI_BASE_URL",
            "https://api.groq.com/openai/v1" if os.getenv("GROQ_API_KEY") else "https://api.openai.com/v1",
        )
    )
    openai_model_id: str = Field(
        default_factory=lambda: os.getenv(
            "OPENAI_MODEL_ID",
            "openai/gpt-oss-120b" if os.getenv("GROQ_API_KEY") else "gpt-4o",
        )
    )

    # Qdrant Cloud Settings
    qdrant_url: Optional[str] = Field(default_factory=lambda: os.getenv("QDRANT_URL"))
    qdrant_api_key: Optional[str] = Field(default_factory=lambda: os.getenv("QDRANT_API_KEY"))
    qdrant_collection_name: str = Field(
        default_factory=lambda: os.getenv("QDRANT_COLLECTION_NAME", "engineering_knowledge_base")
    )
    qdrant_embedding_model: str = Field(
        default_factory=lambda: os.getenv(
            "QDRANT_EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2"
        )
    )

    # Domain Defaults
    default_microservice: str = Field(
        default_factory=lambda: os.getenv("DEFAULT_MICROSERVICE", "income-assessment-service")
    )
    embedding_dimension: int = Field(
        default_factory=lambda: int(
            os.getenv(
                "EMBEDDING_DIMENSION",
                "1024" if (os.getenv("AWS_ACCESS_KEY_ID") and os.getenv("AWS_SECRET_ACCESS_KEY")) else "384",
            )
        )
    )
    max_history_messages: int = Field(
        default_factory=lambda: int(os.getenv("MAX_HISTORY_MESSAGES", "6"))
    )


_settings: Optional[Settings] = None


def get_settings() -> Settings:
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings

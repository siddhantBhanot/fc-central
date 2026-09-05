from typing import List, Optional
from pydantic import BaseModel, Field


class SourceCitationSchema(BaseModel):
    file: str = Field(..., description="Source file name or path")
    class_name: Optional[str] = Field(default=None, description="Extracted class name if code file")
    endpoint: Optional[str] = Field(default=None, description="Extracted REST endpoint if handler")
    start_line: Optional[int] = Field(default=None, description="Starting line number")
    end_line: Optional[int] = Field(default=None, description="Ending line number")
    doc_type: Optional[str] = Field(default=None, description="Document type: markdown or kotlin")
    snippet: Optional[str] = Field(default=None, description="Text preview snippet")


class QueryRequest(BaseModel):
    query: str = Field(..., min_length=1, description="User question or engineering prompt")
    conversation_id: Optional[str] = Field(
        default=None, description="Existing conversation ID to continue multi-turn session"
    )
    service: str = Field(
        default="income-assessment-service",
        description="Target microservice identifier",
    )
    top_k: int = Field(default=5, ge=1, le=20, description="Number of context chunks to retrieve")


class QueryResponse(BaseModel):
    conversation_id: str = Field(..., description="Active conversation identifier")
    message_id: str = Field(..., description="Identifier of the generated assistant message")
    answer: str = Field(..., description="Grounded natural language answer")
    sources: List[SourceCitationSchema] = Field(
        default_factory=list, description="Verified source citations"
    )
    service: str = Field(..., description="Target microservice")
    latency_ms: float = Field(..., description="Total query execution latency in milliseconds")
    provider: str = Field(default="groq", description="LLM provider category")
    model: str = Field(default="default", description="Model identifier used for inference")
    created_at: str = Field(..., description="ISO 8601 timestamp")


class MessageSchema(BaseModel):
    id: str
    role: str
    content: str
    sources: List[SourceCitationSchema] = Field(default_factory=list)
    created_at: str


class ConversationDetailResponse(BaseModel):
    id: str
    service: str
    title: Optional[str] = None
    created_at: str
    updated_at: str
    messages: List[MessageSchema] = Field(default_factory=list)


class ConversationSummary(BaseModel):
    id: str
    service: str
    title: Optional[str] = None
    created_at: str
    updated_at: str

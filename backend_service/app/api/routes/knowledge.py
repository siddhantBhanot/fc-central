from fastapi import APIRouter, Depends

from backend_service.app.api.dependencies import get_current_user, get_knowledge_service
from backend_service.app.api.schemas.knowledge import KnowledgeIngestRequest, KnowledgeIngestResponse
from backend_service.app.application.services.knowledge_service import KnowledgeService
from backend_service.app.domain.models.user import User

router = APIRouter(prefix="/knowledge", tags=["Knowledge & Ingestion"])


@router.post("", response_model=KnowledgeIngestResponse)
async def trigger_knowledge_ingestion(
    payload: KnowledgeIngestRequest,
    current_user: User = Depends(get_current_user),
    knowledge_service: KnowledgeService = Depends(get_knowledge_service),
) -> KnowledgeIngestResponse:
    """
    Trigger semantic chunking, embedding generation, and vector persistence for a microservice.
    Protected endpoint: requires authenticated engineer access.
    """
    result = await knowledge_service.trigger_ingestion(
        service=payload.service,
        source_directory=payload.source_path,
    )
    return KnowledgeIngestResponse(**result)


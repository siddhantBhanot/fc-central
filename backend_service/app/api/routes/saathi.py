import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status

from backend_service.app.application.services.saathi_service import (
    SaathiService,
    get_saathi_service,
)
from backend_service.app.domain.models.saathi import (
    CustomerRelationship,
    CustomerSummaryDTO,
    RelationshipBrief,
    CustomerFeedbackRequest,
    UpdateActionStatusRequest,
    TriggerHandoverRequest,
    TransitionActionItem,
)
from backend_service.app.api.dependencies import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/saathi", tags=["Saathi - Relationship Continuity"])


@router.get("/customers", response_model=List[CustomerSummaryDTO])
async def list_transition_customers(
    saathi_service: SaathiService = Depends(get_saathi_service),
) -> List[CustomerSummaryDTO]:
    """
    List all customer transition cases under Saathi Continuity management.
    """
    return saathi_service.list_customers()


@router.get("/customers/{customer_id}", response_model=CustomerRelationship)
async def get_customer_relationship(
    customer_id: str,
    saathi_service: SaathiService = Depends(get_saathi_service),
) -> CustomerRelationship:
    """
    Retrieve full relationship profile, history, brief, and active handover items.
    """
    customer = saathi_service.get_customer(customer_id)
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer transition profile '{customer_id}' not found.",
        )
    return customer


@router.post("/customers/{customer_id}/synthesize-brief", response_model=RelationshipBrief)
async def synthesize_relationship_brief(
    customer_id: str,
    saathi_service: SaathiService = Depends(get_saathi_service),
) -> RelationshipBrief:
    """
    Step 1 ('We Remember'): Trigger AI synthesis of the Relationship Brief
    from historical interactions and CRM signals.
    """
    try:
        return await saathi_service.synthesize_brief(customer_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to synthesize Saathi brief: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/customers/{customer_id}/customer-feedback", response_model=CustomerRelationship)
async def submit_customer_verification(
    customer_id: str,
    payload: CustomerFeedbackRequest,
    saathi_service: SaathiService = Depends(get_saathi_service),
) -> CustomerRelationship:
    """
    Step 2 ('We Ask the Customer'): Customer confirms or provides additions to Axis' understanding.
    """
    try:
        return saathi_service.submit_customer_feedback(
            customer_id=customer_id,
            customer_notes=payload.customer_notes,
            corrected_items=payload.corrected_items,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.patch("/customers/{customer_id}/actions/{action_id}", response_model=TransitionActionItem)
async def update_transition_action(
    customer_id: str,
    action_id: str,
    payload: UpdateActionStatusRequest,
    saathi_service: SaathiService = Depends(get_saathi_service),
) -> TransitionActionItem:
    """
    Step 4 ('We Hand Over Responsibility'): Update status of an open SLA handover item.
    """
    try:
        return saathi_service.update_action_status(
            customer_id=customer_id,
            action_id=action_id,
            new_status=payload.status,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/customers/{customer_id}/complete-handover", response_model=CustomerRelationship)
async def complete_rm_handover(
    customer_id: str,
    payload: Optional[TriggerHandoverRequest] = None,
    saathi_service: SaathiService = Depends(get_saathi_service),
) -> CustomerRelationship:
    """
    Step 3/4: New RM formally accepts handover, activating full relationship management.
    """
    try:
        notes = payload.new_rm_notes if payload else None
        return saathi_service.complete_handover(customer_id=customer_id, new_rm_notes=notes)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/reset-demo")
async def reset_saathi_demo(
    saathi_service: SaathiService = Depends(get_saathi_service),
) -> dict:
    """
    Reset all demo profiles and interactive transition states.
    """
    saathi_service.reset_demo()
    return {"status": "success", "message": "Saathi demo profiles reset to initial state."}

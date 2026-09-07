from datetime import datetime, timezone
import logging
from typing import Dict, List, Optional

from backend_service.app.domain.models.saathi import (
    CustomerRelationship,
    CustomerSummaryDTO,
    RelationshipBrief,
    CustomerFeedback,
    TransitionStatus,
    ActionStatus,
    TransitionActionItem,
    ActionPriority,
)
from backend_service.app.infrastructure.persistence.saathi_seed import get_saathi_seed_data

logger = logging.getLogger(__name__)


class SaathiService:
    """
    Application service managing the Saathi Relationship Continuity lifecycle:
    1. 'We Remember': Consolidates interactions & generates AI Relationship Brief.
    2. 'We Ask the Customer': Coordinates customer review & captures corrections.
    3. 'Warm Intro': Supplies the new RM with context & conversational openers.
    4. 'Responsibility Handover': Tracks open SLA action items.
    """

    def __init__(self) -> None:
        self._customers: Dict[str, CustomerRelationship] = get_saathi_seed_data()

    def list_customers(self) -> List[CustomerSummaryDTO]:
        """List all customer relationship transition cases."""
        summaries = []
        for c in self._customers.values():
            pending_count = sum(1 for a in c.action_items if a.status != ActionStatus.COMPLETED)
            summaries.append(
                CustomerSummaryDTO(
                    id=c.id,
                    name=c.name,
                    tier=c.tier,
                    city=c.city,
                    account_number_masked=c.account_number_masked,
                    aum_display=c.aum_display,
                    tenure_years=c.tenure_years,
                    previous_rm_name=c.previous_rm_name,
                    new_rm_name=c.new_rm_name,
                    status=c.status,
                    transition_date=c.transition_date,
                    avatar_color=c.avatar_color,
                    pending_actions_count=pending_count,
                )
            )
        return summaries

    def get_customer(self, customer_id: str) -> Optional[CustomerRelationship]:
        """Retrieve full relationship profile with all grounding data."""
        return self._customers.get(customer_id)

    async def synthesize_brief(self, customer_id: str) -> RelationshipBrief:
        """
        Synthesizes a Relationship Brief for the new RM using CRM touchpoints and customer context.
        """
        customer = self._customers.get(customer_id)
        if not customer:
            raise ValueError(f"Customer '{customer_id}' not found.")

        # If already synthesized, update timestamp or regenerate
        now_iso = datetime.now(timezone.utc).isoformat()
        
        # Try dynamic LLM synthesis if DirectRAGClient / Bedrock / Groq is reachable
        try:
            from backend_service.app.infrastructure.clients.direct_rag_client import DirectRAGClient
            rag = DirectRAGClient()
            prompt = (
                f"You are the Axis Bank Saathi Relationship Continuity AI. Synthesize a structured Relationship Brief "
                f"for incoming RM '{customer.new_rm_name}' taking over client '{customer.name}' ({customer.tier.value}, AUM: {customer.aum_display}).\n"
                f"Previous RM: {customer.previous_rm_name} (Reason: {customer.transfer_reason}).\n"
                f"Interactions:\n" + "\n".join([f"- {i.date} ({i.channel}): {i.summary}" for i in customer.interactions]) + "\n"
                f"Generate an empathetic, concise executive summary, family context, nuances, and a warm first-call conversation starter."
            )
            # Query LLM with high temperature for conversational warmth
            resp = await rag.query(question=prompt, conversation_id=None, service="saathi")
            llm_text = resp.get("response", "") if isinstance(resp, dict) else str(resp)

            if llm_text and len(llm_text) > 100:
                customer.brief = RelationshipBrief(
                    client_sentiment=f"High-affinity {customer.tier.value} client ({customer.tenure_years} yrs tenure). Relationship actively protected by Saathi Continuity Engine.",
                    executive_summary=llm_text[:350] + "...",
                    family_and_lifestage=customer.brief.family_and_lifestage if customer.brief else [
                        "Key life stages tracked across historical banking interactions."
                    ],
                    preferences_and_nuances=customer.brief.preferences_and_nuances if customer.brief else [
                        "Communication channels and timings respected."
                    ],
                    active_portfolio_summary=customer.aum_display,
                    key_discussion_topics=[i.tags[0] for i in customer.interactions if i.tags][:4],
                    conversation_starter=(
                        f"Hello {customer.name}, {customer.new_rm_name} here from Axis Bank. {customer.previous_rm_name} "
                        f"has thoroughly briefed me on our journey together. I understand our key priorities and I am already "
                        f"working on your pending requests so you won't have to restart anything. Let me take this forward together."
                    ),
                    talking_points=[f"Review status of {a.title}" for a in customer.action_items[:3]],
                    synthesized_at=now_iso,
                )
                return customer.brief
        except Exception as e:
            logger.info(f"Using deterministic fallback for Saathi synthesis: {e}")

        # Fallback to rich deterministic brief if LLM is unavailable
        if customer.brief:
            customer.brief.synthesized_at = now_iso
            return customer.brief

        # Build initial brief
        customer.brief = RelationshipBrief(
            client_sentiment=f"Valued {customer.tier.value} client ({customer.tenure_years} years).",
            executive_summary=f"Seamless relationship handover from {customer.previous_rm_name} to {customer.new_rm_name}.",
            family_and_lifestage=["Key family priorities recorded in CRM."],
            preferences_and_nuances=["Personal contact preferences respected."],
            active_portfolio_summary=customer.aum_display,
            key_discussion_topics=[t for i in customer.interactions for t in i.tags][:4],
            conversation_starter=f"Hello {customer.name}, {customer.new_rm_name} here from Axis Bank. I am fully briefed on where we are and ready to take this forward.",
            talking_points=[a.title for a in customer.action_items],
            synthesized_at=now_iso,
        )
        return customer.brief

    def submit_customer_feedback(
        self,
        customer_id: str,
        customer_notes: str,
        corrected_items: Optional[List[str]] = None,
    ) -> CustomerRelationship:
        """
        Step 2 in Saathi Journey ('We Ask the Customer'):
        Records client's additions, notes, or verification.
        """
        customer = self._customers.get(customer_id)
        if not customer:
            raise ValueError(f"Customer '{customer_id}' not found.")

        now_iso = datetime.now(timezone.utc).isoformat()
        items = corrected_items or []
        if not items and customer_notes:
            items = [f"Client added custom note: '{customer_notes[:60]}...'"]

        customer.feedback = CustomerFeedback(
            confirmed_at=now_iso,
            customer_notes=customer_notes,
            corrected_items=items,
            has_verified=True,
        )
        customer.status = TransitionStatus.CUSTOMER_CONFIRMED

        # Add a new transition action item reflecting the customer's input!
        if customer_notes:
            new_action = TransitionActionItem(
                id=f"act-cust-{len(customer.action_items) + 1}",
                title=f"Client Verified Request: {customer_notes[:45]}...",
                description=customer_notes,
                category="Customer Additions",
                priority=ActionPriority.HIGH,
                status=ActionStatus.PENDING,
                sla_date=now_iso[:10],
                assigned_to=customer.new_rm_name,
            )
            customer.action_items.insert(0, new_action)

        return customer

    def update_action_status(
        self,
        customer_id: str,
        action_id: str,
        new_status: ActionStatus,
    ) -> TransitionActionItem:
        """
        Step 4 in Saathi Journey ('We Hand Over Responsibility'):
        Track open SLA tasks handed over between RMs.
        """
        customer = self._customers.get(customer_id)
        if not customer:
            raise ValueError(f"Customer '{customer_id}' not found.")

        for item in customer.action_items:
            if item.id == action_id:
                item.status = new_status
                # If all items are completed, mark handover completed
                if all(a.status == ActionStatus.COMPLETED for a in customer.action_items):
                    customer.status = TransitionStatus.COMPLETED
                return item

        raise ValueError(f"Action item '{action_id}' not found for customer '{customer_id}'.")

    def complete_handover(
        self,
        customer_id: str,
        new_rm_notes: Optional[str] = None,
    ) -> CustomerRelationship:
        """
        Step 3/4: New RM formally acknowledges handover and marks it active.
        """
        customer = self._customers.get(customer_id)
        if not customer:
            raise ValueError(f"Customer '{customer_id}' not found.")

        customer.status = TransitionStatus.HANDOVER_ACTIVE
        return customer

    def reset_demo(self) -> None:
        """Reset all demo scenarios to initial states."""
        self._customers = get_saathi_seed_data()


_saathi_service: Optional[SaathiService] = None


def get_saathi_service() -> SaathiService:
    global _saathi_service
    if _saathi_service is None:
        _saathi_service = SaathiService()
    return _saathi_service

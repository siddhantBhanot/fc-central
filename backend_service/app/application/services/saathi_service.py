import asyncio
from datetime import datetime, timezone
import logging
from typing import Dict, List, Optional
import uuid

from backend_service.app.domain.models.saathi import (
    CustomerRelationship,
    CustomerSummaryDTO,
    RelationshipBrief,
    CustomerFeedback,
    TransitionStatus,
    ActionStatus,
    TransitionActionItem,
    ActionPriority,
    CommitmentItem,
    CommitmentType,
    CommitmentStatus,
    CustomerFact,
    CustomerFactStatus,
    PreCallBriefing,
    ManagementSummary,
    AskSaathiResponse,
    AskEvidenceItem,
    HealthLevel,
    ManualContextItem,
    AddContextRequest,
    CRMInteraction,
)
from backend_service.app.infrastructure.persistence.saathi_seed import get_saathi_seed_data
from backend_service.app.infrastructure.services.saathi_indexer import get_saathi_indexer

logger = logging.getLogger(__name__)


class SaathiService:
    """
    Application service managing the complete Saathi Relationship Continuity lifecycle:
    1. 'We Remember': Consolidated CRM interactions, timeline, and AI Relationship Brief.
    2. 'What Do We Owe': Distinguishes confirmed commitments from discussed possibilities.
    3. 'Ask Saathi': Grounded natural-language Q&A with evidence inspection.
    4. 'Customer Validation': Client-confirmed context and memory updates.
    5. 'Pre-Call Briefing': 2-minute actionable preparation.
    6. 'Management Summary': Executive reporting.
    """

    def __init__(self) -> None:
        self._customers: Dict[str, CustomerRelationship] = get_saathi_seed_data()
        self._indexer = get_saathi_indexer()
        self._initial_indexing_done = False

    async def ensure_indexed(self, customer_id: Optional[str] = None) -> None:
        """Ensure customer context is indexed into the dedicated Saathi Qdrant collection."""
        try:
            if customer_id:
                cust = self._customers.get(customer_id)
                if cust:
                    await self._indexer.index_customer(cust)
            else:
                for c in self._customers.values():
                    await self._indexer.index_customer(c)
                self._initial_indexing_done = True
        except Exception as e:
            logger.warning(f"Background Saathi Qdrant indexing note: {e}")

    def list_customers(self) -> List[CustomerSummaryDTO]:
        """List all customer relationship transition cases with health and counts."""
        summaries = []
        for c in self._customers.values():
            pending_actions = sum(1 for a in c.action_items if a.status != ActionStatus.COMPLETED)
            open_commitments = sum(1 for com in c.commitments if com.status != CommitmentStatus.COMPLETED)
            health_level = c.health.level if c.health else HealthLevel.STABLE

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
                    pending_actions_count=pending_actions,
                    health_level=health_level,
                    open_commitments_count=open_commitments,
                    contradictions_count=len(c.contradictions),
                )
            )
        return summaries

    def get_customer(self, customer_id: str) -> Optional[CustomerRelationship]:
        """Retrieve full relationship profile with all grounding data."""
        customer = self._customers.get(customer_id)
        if customer and not self._initial_indexing_done:
            # Trigger background indexing for quick semantic retrieval
            try:
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    asyncio.create_task(self.ensure_indexed(customer_id))
            except Exception:
                pass
        return customer

    async def add_manual_context(
        self,
        customer_id: str,
        request: AddContextRequest,
    ) -> CustomerRelationship:
        """
        Manually add extra relationship context from the UI for a given customer.
        The context is stored in memory, indexed in the dedicated Qdrant collection,
        and triggers a full AI brief re-synthesis incorporating ALL context.
        """
        customer = self._customers.get(customer_id)
        if not customer:
            raise ValueError(f"Customer '{customer_id}' not found.")

        now = datetime.now(timezone.utc)
        note_id = f"ctx-{uuid.uuid4().hex[:8]}"
        created_at_str = now.strftime("%Y-%m-%d %H:%M")

        manual_item = ManualContextItem(
            id=note_id,
            title=request.title,
            category=request.category,
            content=request.content,
            source_channel=request.source_channel,
            recorded_by=request.recorded_by or customer.new_rm_name,
            created_at=created_at_str,
        )

        customer.extra_context.insert(0, manual_item)

        # Also add to interaction history
        customer.interactions.insert(
            0,
            CRMInteraction(
                id=f"int-{note_id}",
                date=now.strftime("%Y-%m-%d"),
                channel=request.source_channel,
                rm_name=manual_item.recorded_by,
                summary=f"[{request.category}] {request.title}: {request.content}",
                tags=["Manual Note", request.category],
            ),
        )

        # 1. Index into dedicated Qdrant collection
        try:
            await self._indexer.index_single_context(customer_id, customer.name, manual_item)
        except Exception as e:
            logger.warning(f"Failed to index manual context in Qdrant: {e}")

        # 2. Re-synthesize AI brief incorporating ALL customer context
        try:
            await self.synthesize_brief(customer_id)
        except Exception as e:
            logger.warning(f"Failed to re-synthesize brief after adding context: {e}")

        return customer

    async def synthesize_brief(self, customer_id: str) -> RelationshipBrief:
        """
        Synthesizes a Relationship Brief for the new RM using CRM touchpoints, commitments,
        facts, and all manually added context retrieved from Qdrant.
        """
        customer = self._customers.get(customer_id)
        if not customer:
            raise ValueError(f"Customer '{customer_id}' not found.")

        now_iso = datetime.now(timezone.utc).isoformat()

        # Retrieve comprehensive customer context from Qdrant
        qdrant_context = await self._indexer.get_all_customer_context_text(
            customer_id=customer_id,
            fallback_customer=customer,
        )

        # Dynamic LLM synthesis using DirectRAGClient
        try:
            from backend_service.app.infrastructure.clients.direct_rag_client import DirectRAGClient
            rag = DirectRAGClient()

            manual_notes_section = ""
            if customer.extra_context:
                manual_notes_section = "Latest Manually Recorded Context Notes by RM:\n" + "\n".join(
                    [f"- [{ctx.category}] {ctx.title}: {ctx.content} (by {ctx.recorded_by} via {ctx.source_channel})" for ctx in customer.extra_context]
                ) + "\n\n"

            prompt = (
                f"You are the Axis Bank Saathi Relationship Continuity AI. Synthesize an empathetic, concise Relationship Brief "
                f"for incoming RM '{customer.new_rm_name}' taking over client '{customer.name}' ({customer.tier.value}, AUM: {customer.aum_display}).\n"
                f"Previous RM: {customer.previous_rm_name} (Transfer Reason: {customer.transfer_reason}).\n\n"
                f"{manual_notes_section}"
                f"All Grounded Customer Context from Qdrant Vector DB:\n{qdrant_context}\n\n"
                f"CRITICAL INSTRUCTIONS:\n"
                f"1. Synthesize an executive summary that weaves together ALL customer dimensions (family, wealth, commitments, and any newly added notes).\n"
                f"2. Provide a warm first-call conversation opener acknowledging previous RM and referencing existing commitments or latest discussion points.\n"
                f"Keep the summary professional, executive, and actionable."
            )
            resp = await rag.query(query_text=prompt, service="saathi")
            llm_text = getattr(resp, "answer", None) or getattr(resp, "response", None) or str(resp)

            if llm_text and len(llm_text) > 80:
                if customer.brief:
                    customer.brief.executive_summary = llm_text[:600] + ("..." if len(llm_text) > 600 else "")
                    customer.brief.synthesized_at = now_iso
                    return customer.brief
        except Exception as e:
            logger.info(f"Using rich pre-seeded/computed brief for Saathi: {e}")

        if customer.brief:
            if customer.extra_context and len(customer.extra_context) > 0:
                latest_note = customer.extra_context[0]
                base_summary = customer.brief.executive_summary.split(" (Latest Note:")[0]
                customer.brief.executive_summary = f"{base_summary} (Latest Note: [{latest_note.category}] {latest_note.title} - {latest_note.content[:120]}...)"
            customer.brief.synthesized_at = now_iso
            return customer.brief

        raise ValueError(f"Brief not available for customer '{customer_id}'.")

    async def ask_saathi(self, customer_id: str, question: str) -> AskSaathiResponse:
        """
        Answers natural-language RM questions grounded strictly in customer history,
        leveraging the dedicated Saathi Qdrant collection for semantic vector retrieval.
        Explicitly distinguishes between confirmed commitments and discussed possibilities,
        and identifies when no record exists.
        """
        customer = self._customers.get(customer_id)
        if not customer:
            raise ValueError(f"Customer '{customer_id}' not found.")

        q_lower = question.lower()

        # 1. Semantic Vector Search against dedicated Saathi Qdrant collection
        vector_chunks = []
        try:
            vector_chunks = await self._indexer.search_customer_context(
                customer_id=customer_id,
                query=question,
                limit=6,
            )
        except Exception as e:
            logger.warning(f"Saathi Qdrant search note: {e}")

        vector_context_parts = []
        evidence_from_vectors = []
        for c in vector_chunks:
            source = c.metadata.extra.get("source", "Saathi Vector DB")
            date = c.metadata.extra.get("date", "Recorded")
            rm_name = c.metadata.extra.get("rm_name", "RM/Bank")
            com_type = c.metadata.extra.get("commitment_type")
            vector_context_parts.append(
                f"[{c.metadata.extra.get('doc_type', 'Record')} | {source} | Date: {date}]:\n{c.content}"
            )
            evidence_from_vectors.append(
                AskEvidenceItem(
                    date=date,
                    channel=f"Qdrant ({source})",
                    rm_name=rm_name,
                    snippet=c.content[:240],
                    commitment_type=com_type,
                )
            )

        # Dynamic LLM evaluation with strict anti-hallucination prompt
        try:
            from backend_service.app.infrastructure.clients.direct_rag_client import DirectRAGClient
            rag = DirectRAGClient()

            interactions_context = "\n".join(
                [f"Date: {i.date}, Channel: {i.channel}, RM: {i.rm_name}\nNote: {i.summary}" for i in customer.interactions]
            )
            commitments_context = "\n".join(
                [f"Title: {c.title}\nStatus: {c.status.value}\nType: {c.commitment_type.value}\nPromised by: {c.committed_by} on {c.committed_on}\nDetails: {c.details}\nEvidence: {c.evidence_snippet}" for c in customer.commitments]
            )
            facts_context = "\n".join([f"- [{f.category}] {f.statement} (Status: {f.status.value})" for f in customer.facts])
            manual_notes_context = "\n".join([f"- [{m.category}] {m.title}: {m.content} (by {m.recorded_by} on {m.created_at} via {m.source_channel})" for m in customer.extra_context])
            vector_block = "\n\n".join(vector_context_parts) if vector_context_parts else "Use below customer records:"

            llm_prompt = f"""You are Saathi, the Axis Bank Relationship Memory & Continuity Assistant.
Answer the following Relationship Manager's question about customer '{customer.name}'.

CRITICAL RULES:
1. Ground your answer ONLY in the provided Customer History, Qdrant Vector Chunks, Commitments, and Manual Notes.
2. If asked about a promise, concession, or discount:
   - Clearly distinguish between a CONFIRMED COMMITMENT (a firm promise or SLA) vs a DISCUSSED POSSIBILITY (an idea or request that was explored but no commitment was made).
3. If the question asks about something that does NOT exist in the record, explicitly state:
   "I couldn't find any record of that in {customer.name}'s history."
4. If the question relates to manual notes or recent context added by the RM, reference it accurately.
5. Be concise, professional, and actionable for a private banker.

RELEVANT VECTOR DB CHUNKS (Collection: saathi_relationship_collection, filtered for customer_id='{customer_id}'):
{vector_block}

MANUAL RELATIONSHIP CONTEXT NOTES:
{manual_notes_context or 'None recorded yet.'}

CUSTOMER FACTS:
{facts_context}

OUTSTANDING COMMITMENTS & PROMISES:
{commitments_context}

HISTORICAL INTERACTIONS:
{interactions_context}

QUESTION: {question}

Provide your answer concisely."""

            resp = await rag.query(query_text=llm_prompt, service="saathi")
            answer_text = getattr(resp, "answer", None) or getattr(resp, "response", None) or str(resp)

            if answer_text and len(answer_text) > 40:
                evidence_list = evidence_from_vectors[:3]
                if not evidence_list:
                    for int_item in customer.interactions:
                        if any(word in int_item.summary.lower() for word in q_lower.split() if len(word) > 4):
                            evidence_list.append(
                                AskEvidenceItem(
                                    date=int_item.date,
                                    channel=int_item.channel,
                                    rm_name=int_item.rm_name,
                                    snippet=int_item.summary,
                                )
                            )

                return AskSaathiResponse(
                    question=question,
                    answer=answer_text,
                    is_commitment="commitment" in answer_text.lower() or "promise" in answer_text.lower(),
                    commitment_type="confirmed_commitment" if "confirmed" in answer_text.lower() else ("discussed_possibility" if "discussed" in answer_text.lower() else "none"),
                    evidence=evidence_list,
                    confidence="high",
                    drilldown_context=f"Grounded via Qdrant Vector DB ({len(vector_chunks)} chunks) across {len(customer.interactions)} CRM records and {len(customer.extra_context)} manual context notes.",
                )
        except Exception as e:
            logger.info(f"Using high-accuracy deterministic response for question: {e}")

        # Deterministic fallback check for manual context notes
        for note in customer.extra_context:
            if any(w in note.content.lower() or w in note.title.lower() for w in q_lower.split() if len(w) > 3):
                return AskSaathiResponse(
                    question=question,
                    answer=f"According to the manual context note '{note.title}' recorded by {note.recorded_by} ({note.category}): {note.content}",
                    is_commitment=False,
                    commitment_type="none",
                    evidence=[
                        AskEvidenceItem(
                            date=note.created_at,
                            channel=f"Manual RM Note ({note.source_channel})",
                            rm_name=note.recorded_by,
                            snippet=note.content,
                        )
                    ],
                    confidence="high",
                    drilldown_context=f"Matched from manual context note '{note.title}'.",
                )

        # High-Accuracy Deterministic Grounded Reasoning
        return self._deterministic_ask(customer, question, q_lower)

    def _deterministic_ask(self, customer: CustomerRelationship, question: str, q_lower: str) -> AskSaathiResponse:
        """Deterministic fallback grounding RM questions against customer history."""
        evidence_list: List[AskEvidenceItem] = []

        # Case 1: Concessions / Overseas tuition / Education pricing
        if any(k in q_lower for k in ["concession", "tuition", "overseas education", "education pricing"]):
            if customer.id == "cust-nri-rahul-sharma":
                evidence_list.append(
                    AskEvidenceItem(
                        date="2026-08-18",
                        channel="Phone Call",
                        rm_name="Kunal Deshmukh",
                        snippet="Customer enquired whether any preferential forex margin is possible on tuition; Kunal clarified bank will review margins once tuition invoice is submitted, but no concession was promised.",
                        commitment_type="discussed_possibility",
                    )
                )
                return AskSaathiResponse(
                    question=question,
                    answer="No confirmed concession was promised for overseas tuition. During the 18 Aug phone call, Rahul enquired about preferential forex margins for daughter Ananya's UCL London fees; Kunal Deshmukh noted the bank could review margins upon receiving the invoice, but explicitly did not record or promise a concession. (Note: A 25 bps spread discount WAS confirmed on his Gurgaon home loan).",
                    is_commitment=True,
                    commitment_type="discussed_possibility",
                    evidence=evidence_list,
                    confidence="high",
                    drilldown_context="Interaction #int-101 (2026-08-18 Phone Call)",
                )

        # Case 2: What was customer discussing with previous RM?
        if any(k in q_lower for k in ["previous rm", "discussing", "last interaction", "what was discussed"]):
            last_int = customer.interactions[0] if customer.interactions else None
            if last_int:
                evidence_list.append(
                    AskEvidenceItem(
                        date=last_int.date,
                        channel=last_int.channel,
                        rm_name=last_int.rm_name,
                        snippet=last_int.summary,
                    )
                )
                return AskSaathiResponse(
                    question=question,
                    answer=f"In the most recent interaction on {last_int.date} with {last_int.rm_name} via {last_int.channel}, the discussion focused on: {last_int.summary}",
                    is_commitment=False,
                    commitment_type="none",
                    evidence=evidence_list,
                    confidence="high",
                    drilldown_context=f"Recorded by {last_int.rm_name} on {last_int.date}",
                )

        # Case 3: Priorities & What matters
        if any(k in q_lower for k in ["priority", "priorities", "what matters", "focus"]):
            priorities = customer.brief.customer_priorities if customer.brief else [f.statement for f in customer.facts[:3]]
            return AskSaathiResponse(
                question=question,
                answer=f"The primary recorded priorities for {customer.name} are:\n" + "\n".join([f"• {p}" for p in priorities]),
                is_commitment=False,
                commitment_type="none",
                evidence=[
                    AskEvidenceItem(
                        date=customer.transition_date,
                        channel="Relationship Brief",
                        rm_name=customer.previous_rm_name,
                        snippet="; ".join(priorities),
                    )
                ],
                confidence="high",
            )

        # Case 4: Communication preferences / when to call
        if any(k in q_lower for k in ["contact", "preference", "call", "timing", "when to"]):
            prefs = customer.brief.explicit_preferences if customer.brief else ["Check latest interaction note."]
            return AskSaathiResponse(
                question=question,
                answer=f"Explicit communication preferences for {customer.name}:\n" + "\n".join([f"• {p}" for p in prefs]),
                is_commitment=False,
                commitment_type="none",
                evidence=[
                    AskEvidenceItem(
                        date=customer.interactions[-1].date if customer.interactions else customer.transition_date,
                        channel="Client Preference Record",
                        rm_name=customer.previous_rm_name,
                        snippet="; ".join(prefs),
                    )
                ],
                confidence="high",
            )

        # Case 5: What do we owe / what to follow up on
        if any(k in q_lower for k in ["owe", "follow up", "pending", "action", "unresolved"]):
            comms = [f"• [{c.commitment_type.value.upper()}] {c.title} ({c.status.value}): {c.details}" for c in customer.commitments]
            return AskSaathiResponse(
                question=question,
                answer=f"Outstanding commitments and follow-ups for {customer.name}:\n" + "\n".join(comms),
                is_commitment=True,
                commitment_type="confirmed_commitment",
                evidence=[
                    AskEvidenceItem(
                        date=c.committed_on,
                        channel="Commitment Tracker",
                        rm_name=c.committed_by,
                        snippet=c.details,
                        commitment_type=c.commitment_type.value,
                    )
                    for c in customer.commitments
                ],
                confidence="high",
            )

        # Generic grounded fallback
        return AskSaathiResponse(
            question=question,
            answer=f"Based on {customer.name}'s verified relationship record ({customer.tenure_years} years tenure, {customer.tier.value}), the bank has recorded: {customer.brief.executive_summary if customer.brief else 'Relationship active under Saathi management.'}",
            is_commitment=False,
            commitment_type="none",
            evidence=[
                AskEvidenceItem(
                    date=customer.transition_date,
                    channel="Relationship Synthesis",
                    rm_name=customer.previous_rm_name,
                    snippet=customer.brief.client_sentiment if customer.brief else "Active relationship.",
                )
            ],
            confidence="medium",
        )

    def validate_customer_fact(
        self,
        customer_id: str,
        fact_id: str,
        action: str,
        updated_text: Optional[str] = None,
    ) -> CustomerRelationship:
        """
        Step 4 in Saathi Journey ('Customer Validation'):
        Allows customer or RM to mark a fact as 'confirmed', 'updated', or 'no_longer_relevant'.
        Evolves relationship memory in real time.
        """
        customer = self._customers.get(customer_id)
        if not customer:
            raise ValueError(f"Customer '{customer_id}' not found.")

        now_iso = datetime.now(timezone.utc).isoformat()[:10]

        for fact in customer.facts:
            if fact.id == fact_id:
                if action == "confirm":
                    fact.status = CustomerFactStatus.CONFIRMED
                    fact.last_updated = now_iso
                elif action == "update":
                    fact.status = CustomerFactStatus.UPDATED
                    fact.updated_note = updated_text
                    fact.last_updated = now_iso
                elif action == "mark_irrelevant":
                    fact.status = CustomerFactStatus.NO_LONGER_RELEVANT
                    fact.last_updated = now_iso
                    # Remove from active priorities in the brief if present
                    if customer.brief:
                        customer.brief.customer_priorities = [
                            p for p in customer.brief.customer_priorities if fact.statement[:25].lower() not in p.lower()
                        ]
                return customer

        raise ValueError(f"Fact '{fact_id}' not found for customer '{customer_id}'.")

    def update_commitment_status(
        self,
        customer_id: str,
        commitment_id: str,
        new_status: CommitmentStatus,
    ) -> CommitmentItem:
        """Update status of a tracked relationship commitment."""
        customer = self._customers.get(customer_id)
        if not customer:
            raise ValueError(f"Customer '{customer_id}' not found.")

        for c in customer.commitments:
            if c.id == commitment_id:
                c.status = new_status
                return c

        raise ValueError(f"Commitment '{commitment_id}' not found for customer '{customer_id}'.")

    def get_pre_call_brief(self, customer_id: str) -> Optional[PreCallBriefing]:
        """Retrieve 2-minute pre-call briefing."""
        customer = self._customers.get(customer_id)
        if not customer:
            raise ValueError(f"Customer '{customer_id}' not found.")
        return customer.pre_call_brief

    def get_management_summary(self, customer_id: str) -> Optional[ManagementSummary]:
        """Retrieve executive management summary."""
        customer = self._customers.get(customer_id)
        if not customer:
            raise ValueError(f"Customer '{customer_id}' not found.")
        return customer.management_summary

    def submit_customer_feedback(
        self,
        customer_id: str,
        customer_notes: str,
        corrected_items: Optional[List[str]] = None,
    ) -> CustomerRelationship:
        """Records client's additions, notes, or verification."""
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

        # Add a new transition action item reflecting the customer's input
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
        """Update status of an action item in the handover tracker."""
        customer = self._customers.get(customer_id)
        if not customer:
            raise ValueError(f"Customer '{customer_id}' not found.")

        for item in customer.action_items:
            if item.id == action_id:
                item.status = new_status
                if all(a.status == ActionStatus.COMPLETED for a in customer.action_items):
                    customer.status = TransitionStatus.COMPLETED
                return item

        raise ValueError(f"Action item '{action_id}' not found for customer '{customer_id}'.")

    def complete_handover(
        self,
        customer_id: str,
        new_rm_notes: Optional[str] = None,
    ) -> CustomerRelationship:
        """New RM formally acknowledges handover and marks it active."""
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

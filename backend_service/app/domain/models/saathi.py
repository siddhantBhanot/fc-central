from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ClientTier(str, Enum):
    BURGUNDY = "Burgundy"
    BURGUNDY_PRIVATE = "Burgundy Private"
    NRI_ELITE = "NRI Elite"
    WEALTH = "Axis Wealth"
    PRIORITY = "Priority Banking"


class TransitionStatus(str, Enum):
    INITIATED = "initiated"                 # RM transfer announced, synthesizing brief
    CUSTOMER_REVIEW = "customer_review"     # Reached out to customer for verification
    CUSTOMER_CONFIRMED = "customer_confirmed" # Customer added notes / verified
    HANDOVER_ACTIVE = "handover_active"     # New RM active with full brief & action tracker
    COMPLETED = "completed"                 # All transition tasks completed


class ActionPriority(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class ActionStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class CRMInteraction(BaseModel):
    id: str
    date: str
    channel: str  # e.g., "Branch Meeting", "Phone Call", "WhatsApp Note", "Portfolio Review"
    rm_name: str
    summary: str
    tags: List[str] = Field(default_factory=list)


class TransitionActionItem(BaseModel):
    id: str
    title: str
    description: str
    category: str  # e.g., "Loan Renewal", "Wealth Allocation", "KYC / Service Request", "Family Assistance"
    priority: ActionPriority = ActionPriority.HIGH
    status: ActionStatus = ActionStatus.PENDING
    sla_date: str
    assigned_to: str


class RelationshipBrief(BaseModel):
    client_sentiment: str
    executive_summary: str
    family_and_lifestage: List[str]
    preferences_and_nuances: List[str]
    active_portfolio_summary: str
    key_discussion_topics: List[str]
    conversation_starter: str
    talking_points: List[str]
    synthesized_at: str


class CustomerFeedback(BaseModel):
    confirmed_at: Optional[str] = None
    customer_notes: Optional[str] = None
    corrected_items: List[str] = Field(default_factory=list)
    has_verified: bool = False


class CustomerRelationship(BaseModel):
    id: str
    name: str
    tier: ClientTier
    segment_description: str
    city: str
    account_number_masked: str
    aum_display: str
    tenure_years: int
    avatar_color: str
    
    # RM Details
    previous_rm_name: str
    previous_rm_role: str
    transfer_reason: str
    new_rm_name: str
    new_rm_role: str
    new_rm_phone: str
    new_rm_email: str
    
    # Transition Pipeline
    status: TransitionStatus = TransitionStatus.INITIATED
    transition_date: str
    
    # Grounding Data
    interactions: List[CRMInteraction] = Field(default_factory=list)
    action_items: List[TransitionActionItem] = Field(default_factory=list)
    brief: Optional[RelationshipBrief] = None
    feedback: Optional[CustomerFeedback] = None


class CustomerSummaryDTO(BaseModel):
    id: str
    name: str
    tier: ClientTier
    city: str
    account_number_masked: str
    aum_display: str
    tenure_years: int
    previous_rm_name: str
    new_rm_name: str
    status: TransitionStatus
    transition_date: str
    avatar_color: str
    pending_actions_count: int


class CustomerFeedbackRequest(BaseModel):
    customer_notes: str
    corrected_items: Optional[List[str]] = None


class UpdateActionStatusRequest(BaseModel):
    status: ActionStatus


class TriggerHandoverRequest(BaseModel):
    new_rm_notes: Optional[str] = None

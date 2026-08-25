"""
Immutable Audit Trail & Timeline Models.
"""
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field

class AuditTimelineEvent(BaseModel):
    timestamp: str
    transaction_id: str
    utr: Optional[str] = None
    step_name: str
    rule_or_model: str
    input_values: Dict[str, Any] = Field(default_factory=dict)
    calculated_values: Dict[str, Any] = Field(default_factory=dict)
    ai_proposal: Optional[Dict[str, Any]] = None
    verifier_result: Optional[Dict[str, Any]] = None
    final_decision: str
    human_approved: bool = False
    details: str

class AuditTrailResponse(BaseModel):
    transaction_id: str
    events: List[AuditTimelineEvent]
    total_events: int
    is_fully_auditable: bool = True

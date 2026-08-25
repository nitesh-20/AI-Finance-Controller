from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class FinanceHealthScoreModel(BaseModel):
    overall_score: int = Field(..., alias="overallScore")  # 0 - 100
    reconciliation_score: int = Field(..., alias="reconciliationScore")
    settlement_score: int = Field(..., alias="settlementScore")
    exception_score: int = Field(..., alias="exceptionScore")
    cash_position_score: int = Field(..., alias="cashPositionScore")
    previous_score: int = Field(..., alias="previousScore")
    score_change: int = Field(..., alias="scoreChange")  # delta e.g. -6 or +6
    reason_for_change: str = Field(..., alias="reasonForChange")
    last_updated: str = Field(..., alias="lastUpdated")

    class Config:
        populate_by_name = True

class AttentionItemModel(BaseModel):
    id: str
    transaction_id: str = Field(..., alias="transactionId")
    order_id: str = Field(..., alias="orderId")
    customer_name: str = Field(..., alias="customerName")
    amount: float
    title: str
    category: str
    severity: str  # CRITICAL, HIGH, MEDIUM, LOW
    impact_level: str = Field(..., alias="impactLevel")  # HIGH IMPACT, MEDIUM IMPACT, LOW CONFIDENCE
    days_unresolved: int = Field(..., alias="daysUnresolved")
    confidence: int  # percentage
    recommendation: str
    action_type: str = Field(..., alias="actionType")  # DISPUTE_RAZORPAY, JOURNAL_ADJUSTMENT, QUARANTINE, REFUND_DUPLICATE
    suggested_action_label: str = Field(..., alias="suggestedActionLabel")

    class Config:
        populate_by_name = True

class ActionExecutionRequest(BaseModel):
    transaction_id: str = Field(..., alias="transactionId")
    action_type: str = Field(..., alias="actionType")  # DISPUTE_RAZORPAY, JOURNAL_ADJUSTMENT, QUARANTINE, REFUND_DUPLICATE, MARK_RESOLVED
    notes: Optional[str] = None

    class Config:
        populate_by_name = True

class VerificationResultModel(BaseModel):
    is_verified: bool = Field(..., alias="isVerified")
    previous_status: str = Field(..., alias="previousStatus")
    new_status: str = Field(..., alias="newStatus")
    previous_variance: float = Field(..., alias="previousVariance")
    new_variance: float = Field(..., alias="newVariance")
    variance_cleared: float = Field(..., alias="varianceCleared")
    verification_message: str = Field(..., alias="verificationMessage")

    class Config:
        populate_by_name = True

class ActionExecutionResponse(BaseModel):
    success: bool
    action_id: str = Field(..., alias="actionId")
    transaction_id: str = Field(..., alias="transactionId")
    action_type: str = Field(..., alias="actionType")
    timestamp: str
    message: str
    health_score_before: int = Field(..., alias="healthScoreBefore")
    health_score_after: int = Field(..., alias="healthScoreAfter")
    health_score_delta: int = Field(..., alias="healthScoreDelta")
    audit_event_id: str = Field(..., alias="auditEventId")
    verification: VerificationResultModel

    class Config:
        populate_by_name = True

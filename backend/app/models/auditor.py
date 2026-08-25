from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum

class RootCauseClassification(str, Enum):
    MATCHED = "MATCHED"
    WRONG_MDR_TIER = "Wrong MDR Tier Applied"
    GST_ROUNDING_ERROR = "GST / Rounding Error"
    CHARGEBACK_RESERVE = "Unmapped Chargeback Reserve"
    MISSING_SETTLEMENT = "Missing Settlement"
    DUPLICATE_TRANSACTION = "Duplicate Transaction"
    CURRENCY_MARKUP = "Currency Markup"
    SETTLEMENT_FEE_VARIANCE = "Settlement Fee Variance"
    TDS_DIFFERENCE = "TDS Difference"
    UNKNOWN_REVIEW = "Unknown / Requires Review"

class RecommendedAction(str, Enum):
    RECONCILE_CLEAN = "RECONCILE_CLEAN"
    DISPUTE_RAZORPAY = "DISPUTE_RAZORPAY"
    JOURNAL_ADJUSTMENT = "JOURNAL_ADJUSTMENT"
    QUARANTINE = "QUARANTINE"
    REFUND_DUPLICATE = "REFUND_DUPLICATE"

class AuditWaterfallModel(BaseModel):
    gross_amount: float = Field(..., alias="grossAmount")
    contracted_mdr_rate: float = Field(0.02, alias="contractedMdrRate")  # e.g. 0.02 = 2.00%
    mdr_amount: float = Field(..., alias="mdrAmount")
    gst_rate: float = Field(0.18, alias="gstRate")  # 18% statutory
    gst_on_mdr: float = Field(..., alias="gstOnMdr")
    tds_rate: float = Field(0.0, alias="tdsRate")
    tds_amount: float = Field(0.0, alias="tdsAmount")
    theoretical_net_settlement: float = Field(..., alias="theoreticalNetSettlement")
    actual_net_settled: float = Field(..., alias="actualNetSettled")
    variance: float = Field(..., alias="variance")

    class Config:
        populate_by_name = True

class AuditTrailStepModel(BaseModel):
    step_number: int = Field(..., alias="stepNumber")
    title: str
    description: str
    status: str = "COMPLETED"  # COMPLETED, FLAGGED, SKIPPED
    timestamp: str
    meta: Optional[Dict[str, Any]] = None

    class Config:
        populate_by_name = True

class TransactionAuditResultModel(BaseModel):
    transaction_id: str = Field(..., alias="transactionId")
    order_id: str = Field(..., alias="orderId")
    customer_name: str = Field(..., alias="customerName")
    payment_method: str = Field(..., alias="paymentMethod")
    reconciliation_status: str = Field(..., alias="reconciliationStatus")  # MATCHED, DISCREPANCY, PENDING
    variance_amount: float = Field(..., alias="varianceAmount")
    root_cause: str = Field(..., alias="rootCause")
    confidence_score: int = Field(..., alias="confidenceScore")  # 0 - 100
    why_flagged: str = Field(..., alias="whyFlagged")
    recommended_action: str = Field(..., alias="recommendedAction")
    waterfall: AuditWaterfallModel
    evidence: List[str]
    audit_steps: List[AuditTrailStepModel] = Field(..., alias="auditSteps")
    action_taken: Optional[str] = Field(None, alias="actionTaken")
    audited_at: str = Field(..., alias="auditedAt")

    class Config:
        populate_by_name = True

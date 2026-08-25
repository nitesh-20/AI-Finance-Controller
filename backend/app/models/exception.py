from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

class ExceptionEvidenceModel(BaseModel):
    order_amount: float = Field(..., alias="orderAmount")
    payment_captured_amount: float = Field(..., alias="paymentCapturedAmount")
    expected_fee: float = Field(..., alias="expectedFee")
    actual_fee_deducted: Optional[float] = Field(None, alias="actualFeeDeducted")
    settlement_amount_received: Optional[float] = Field(None, alias="settlementAmountReceived")
    gateway_status: Optional[str] = Field(None, alias="gatewayStatus")
    timestamp_discrepancy_hours: Optional[float] = Field(0.0, alias="timestampDiscrepancyHours")
    raw_trace: Optional[Dict[str, Any]] = Field(None, alias="rawTrace")

    class Config:
        populate_by_name = True

class FinancialExceptionModel(BaseModel):
    id: str
    exception_code: str = Field(..., alias="exceptionCode")
    record_id: str = Field(..., alias="recordId")
    transaction_id: str = Field(..., alias="transactionId")
    order_id: str = Field(..., alias="orderId")
    settlement_id: Optional[str] = Field(None, alias="settlementId")
    type: str
    severity: str  # LOW, MEDIUM, HIGH, CRITICAL
    status: str = "OPEN"  # OPEN, INVESTIGATING, RESOLVED, UNABLE_TO_RESOLVE
    expected_amount: float = Field(..., alias="expectedAmount")
    actual_amount: float = Field(..., alias="actualAmount")
    difference: float
    detected_at: str = Field(..., alias="detectedAt")
    ai_explanation: str = Field(..., alias="aiExplanation")
    suggested_action: str = Field(..., alias="suggestedAction")
    resolution_notes: Optional[str] = Field(None, alias="resolutionNotes")
    resolved_at: Optional[str] = Field(None, alias="resolvedAt")
    resolved_by: Optional[str] = Field(None, alias="resolvedBy")
    evidence: ExceptionEvidenceModel

    class Config:
        populate_by_name = True

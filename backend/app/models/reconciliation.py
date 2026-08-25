"""
Comprehensive 3-Way Reconciliation & Verification Models.
"""
from typing import List, Optional, Dict, Any
from enum import Enum
from pydantic import BaseModel, Field

class MatchClassificationEnum(str, Enum):
    MATCHED = "MATCHED"
    PARTIAL_MATCH = "PARTIAL_MATCH"
    AMOUNT_MISMATCH = "AMOUNT_MISMATCH"
    MISSING_SETTLEMENT = "MISSING_SETTLEMENT"
    DUPLICATE_TRANSACTION = "DUPLICATE_TRANSACTION"
    DATE_MISMATCH = "DATE_MISMATCH"
    FEE_DISCREPANCY = "FEE_DISCREPANCY"
    UNRESOLVED_EXCEPTION = "UNRESOLVED_EXCEPTION"

class AuditWaterfallModel(BaseModel):
    gross_amount: float
    contracted_mdr_rate: float
    mdr_amount: float
    gst_rate: float
    gst_amount: float
    tds_rate: float = 0.0
    tds_amount: float = 0.0
    refund_amount: float = 0.0
    chargeback_amount: float = 0.0
    other_deductions: float = 0.0
    theoretical_net_settlement: float
    actual_bank_credit: float
    variance: float

class VerificationResultModel(BaseModel):
    verification_status: str  # VERIFIED, REJECTED, QUARANTINED
    expected_amount: float
    actual_amount: float
    variance: float
    checks_passed: List[str] = Field(default_factory=list)
    checks_failed: List[str] = Field(default_factory=list)
    verified_at: str

class AIProposalModel(BaseModel):
    proposal_type: str  # EXACT_MATCH, PARTIAL_MATCH, SPLIT_SETTLEMENT, NARRATION_MAPPING, CHARGEBACK_LINK
    candidate_records: List[str] = Field(default_factory=list)
    reasoning: str
    evidence: List[str] = Field(default_factory=list)
    confidence: float
    proposed_net: float
    suggested_action: str

class ThreeWayReconciliationRecord(BaseModel):
    transaction_id: str
    utr: str
    order_id: str
    invoice_id: str
    merchant_name: str = "Merchant Store"
    customer_name: str
    gross_amount: float
    mdr: float
    gst_on_mdr: float
    refund: float = 0.0
    chargeback: float = 0.0
    tds: float = 0.0
    other_deductions: float = 0.0
    expected_settlement: float
    actual_bank_credit: float
    variance: float
    settlement_date: str
    bank_date: Optional[str] = None
    ledger_date: Optional[str] = None
    current_status: str  # MATCHED, AI_PROPOSED, VERIFIED, DISCREPANCY, EXCEPTION, QUARANTINED, APPROVED, JOURNAL_ADJUSTMENT, DISPUTE_RAZORPAY
    match_method: str    # UTR_EXACT, AMOUNT_DATE_TOLERANCE, REFERENCE_ID, SUBSET_SUM, AI_SEMANTIC, MANUAL
    verification_status: str  # VERIFIED, REJECTED, PENDING
    ai_proposal: Optional[AIProposalModel] = None
    verification_result: Optional[VerificationResultModel] = None
    waterfall: Optional[AuditWaterfallModel] = None
    root_cause: Optional[str] = None
    evidence: List[str] = Field(default_factory=list)
    recommended_action: Optional[str] = None

class ThreeWayBatchResult(BaseModel):
    batch_id: str
    timestamp: str
    total_records: int
    matched_count: int
    ai_proposed_count: int
    verified_count: int
    rejected_count: int
    exception_count: int
    auto_match_precision: float = 100.0
    wrong_auto_posts: int = 0
    records: List[ThreeWayReconciliationRecord]

# ----------------------------------------------------
# Legacy Compatibility Models
# ----------------------------------------------------
class ProcessedRecordModel(BaseModel):
    id: str
    transactionId: str
    orderId: str
    settlementId: Optional[str] = None
    timestamp: str
    customerName: str
    paymentMethod: str
    grossAmount: float
    expectedGatewayFee: float
    expectedGst: float
    expectedSettlementAmount: float
    actualSettlementAmount: float
    actualGatewayFee: float
    actualGst: float
    status: str
    settlementStatus: str
    classification: str
    discrepancyAmount: float
    confidenceScore: float = 1.0
    ruleApplied: str = "DETERMINISTIC_RULES"
    notes: Optional[str] = None

class ReconciliationMetricsModel(BaseModel):
    totalRecordsProcessed: int
    matchedCount: int
    partialCount: int
    unmatchedCount: int
    exceptionsCount: int
    matchRatePercentage: float
    totalGrossProcessed: float
    totalReconciledAmount: float
    totalExceptionAmount: float
    totalFeesPaid: float
    processingDurationMs: int
    batchTimestamp: str

    @property
    def total_records_processed(self) -> int:
        return self.totalRecordsProcessed

    @property
    def match_rate_percentage(self) -> float:
        return self.matchRatePercentage

    @property
    def exceptions_count(self) -> int:
        return self.exceptionsCount

    @property
    def matched_count(self) -> int:
        return self.matchedCount

    @property
    def total_gross_processed(self) -> float:
        return self.totalGrossProcessed

    @property
    def total_reconciled_amount(self) -> float:
        return self.totalReconciledAmount

    @property
    def total_exception_amount(self) -> float:
        return self.totalExceptionAmount

class ReconciliationBatchResponse(BaseModel):
    metrics: ReconciliationMetricsModel
    records: List[ProcessedRecordModel]
    exceptions: List[Any] = Field(default_factory=list)

class ReconciliationBatchResultModel(BaseModel):
    records: List[ProcessedRecordModel]
    exceptions: List[Any] = Field(default_factory=list)
    metrics: ReconciliationMetricsModel

class TransactionAuditResultModel(BaseModel):
    transactionId: str
    classification: str
    confidenceScore: float
    ruleApplied: str
    varianceAmount: float
    diagnosedRootCause: str
    auditSteps: List[Dict[str, Any]] = Field(default_factory=list)
    recommendedAction: str

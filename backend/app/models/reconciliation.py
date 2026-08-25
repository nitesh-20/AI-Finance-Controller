from typing import List, Optional
from pydantic import BaseModel, Field
from .transaction import FinancialRecordModel
from .exception import FinancialExceptionModel

class ReconciliationMetricsModel(BaseModel):
    total_records_processed: int = Field(..., alias="totalRecordsProcessed")
    matched_count: int = Field(..., alias="matchedCount")
    partial_count: int = Field(..., alias="partialCount")
    unmatched_count: int = Field(..., alias="unmatchedCount")
    exceptions_count: int = Field(..., alias="exceptionsCount")
    match_rate_percentage: float = Field(..., alias="matchRatePercentage")
    total_gross_processed: float = Field(..., alias="totalGrossProcessed")
    total_reconciled_amount: float = Field(..., alias="totalReconciledAmount")
    total_exception_amount: float = Field(..., alias="totalExceptionAmount")
    total_fees_paid: float = Field(..., alias="totalFeesPaid")
    processing_duration_ms: int = Field(..., alias="processingDurationMs")
    batch_timestamp: str = Field(..., alias="batchTimestamp")

    class Config:
        populate_by_name = True

class ProcessedRecordModel(FinancialRecordModel):
    classification: str
    discrepancy_amount: float = Field(0.0, alias="discrepancyAmount")

    class Config:
        populate_by_name = True

class ReconciliationBatchResultModel(BaseModel):
    records: List[ProcessedRecordModel]
    exceptions: List[FinancialExceptionModel]
    metrics: ReconciliationMetricsModel

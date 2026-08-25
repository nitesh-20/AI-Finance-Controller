from typing import Optional, List
from pydantic import BaseModel, Field

class SettlementRecordModel(BaseModel):
    settlement_id: str = Field(..., alias="settlementId")
    settlement_date: str = Field(..., alias="settlementDate")
    gross_volume: float = Field(..., alias="grossVolume")
    total_transactions: int = Field(..., alias="totalTransactions")
    gateway_fees: float = Field(..., alias="gatewayFees")
    gst_on_fees: float = Field(..., alias="gstOnFees")
    refunds_deducted: float = Field(0.0, alias="refundsDeducted")
    adjustments: float = Field(0.0, alias="adjustments")
    net_settlement_expected: float = Field(..., alias="netSettlementExpected")
    net_settlement_actual: float = Field(..., alias="netSettlementActual")
    difference: float = 0.0
    status: str = "settled"
    utr_number: Optional[str] = Field(None, alias="utrNumber")
    bank_account_last4: str = Field("4892", alias="bankAccountLast4")
    discrepancies_count: int = Field(0, alias="discrepanciesCount")
    discrepancy_reason: Optional[str] = Field(None, alias="discrepancyReason")

    class Config:
        populate_by_name = True

class SettlementOverviewModel(BaseModel):
    total_gross_settled: float = Field(..., alias="totalGrossSettled")
    total_net_received: float = Field(..., alias="totalNetReceived")
    total_fees_deducted: float = Field(..., alias="totalFeesDeducted")
    total_gst_deducted: float = Field(..., alias="totalGstDeducted")
    total_discrepancy_amount: float = Field(..., alias="totalDiscrepancyAmount")
    pending_settlement_amount: float = Field(..., alias="pendingSettlementAmount")
    batches: List[SettlementRecordModel]

    class Config:
        populate_by_name = True

from typing import Optional, List
from pydantic import BaseModel, Field

class FinancialRecordModel(BaseModel):
    id: str
    transaction_id: str = Field(..., alias="transactionId")
    order_id: str = Field(..., alias="orderId")
    settlement_id: Optional[str] = Field(None, alias="settlementId")
    timestamp: str
    customer_name: str = Field(..., alias="customerName")
    payment_method: str = Field(..., alias="paymentMethod")
    gross_amount: float = Field(..., alias="grossAmount")
    expected_gateway_fee: float = Field(..., alias="expectedGatewayFee")
    expected_gst: float = Field(..., alias="expectedGst")
    expected_settlement_amount: float = Field(..., alias="expectedSettlementAmount")
    actual_settlement_amount: Optional[float] = Field(None, alias="actualSettlementAmount")
    actual_gateway_fee: Optional[float] = Field(None, alias="actualGatewayFee")
    actual_gst: Optional[float] = Field(None, alias="actualGst")
    status: str = "success"
    settlement_status: str = Field("settled", alias="settlementStatus")
    settlement_date: Optional[str] = Field(None, alias="settlementDate")
    batch_id: Optional[str] = Field(None, alias="batchId")
    arn_number: Optional[str] = Field(None, alias="arnNumber")
    notes: Optional[str] = None
    is_refund: Optional[bool] = Field(False, alias="isRefund")
    refund_amount: Optional[float] = Field(0.0, alias="refundAmount")

    class Config:
        populate_by_name = True

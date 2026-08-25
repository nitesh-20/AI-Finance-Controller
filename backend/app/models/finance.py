from typing import List, Optional
from pydantic import BaseModel, Field

class CashPositionModel(BaseModel):
    current_available_cash: float = Field(..., alias="currentAvailableCash")
    expected_settlements_inflow: float = Field(..., alias="expectedSettlementsInflow")
    pending_gateway_holdbacks: float = Field(..., alias="pendingGatewayHoldbacks")
    refund_obligations: float = Field(..., alias="refundObligations")
    projected_net_position: float = Field(..., alias="projectedNetPosition")
    last_updated: str = Field(..., alias="lastUpdated")

    class Config:
        populate_by_name = True

class CashForecastDayModel(BaseModel):
    date: str
    day_label: str = Field(..., alias="dayLabel")
    projected_inflow: float = Field(..., alias="projectedInflow")
    projected_outflow: float = Field(..., alias="projectedOutflow")
    projected_closing_balance: float = Field(..., alias="projectedClosingBalance")
    confidence_score: int = Field(..., alias="confidenceScore")

    class Config:
        populate_by_name = True

class AIInsightItemModel(BaseModel):
    id: str
    title: str
    category: str  # RECONCILIATION, SETTLEMENT, CASH_FLOW, ANOMALY
    level: str  # info, warning, critical, success
    summary: str
    details: str
    actionable_step: Optional[str] = Field(None, alias="actionableStep")
    related_ids: Optional[List[str]] = Field(None, alias="relatedIds")
    timestamp: str

    class Config:
        populate_by_name = True

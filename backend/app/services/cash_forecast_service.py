from datetime import datetime, timedelta, timezone
from typing import List, Tuple, Dict, Any
from ..models.finance import CashPositionModel, CashForecastDayModel
from .settlement_service import settlement_service

class CashForecastService:
    def __init__(self, base_cash: float = 246500.0, refund_buffer: float = 12500.0):
        self.base_cash = base_cash
        self.refund_buffer = refund_buffer

    def calculate_cash_position_and_forecast(self) -> Tuple[CashPositionModel, List[CashForecastDayModel]]:
        overview = settlement_service.get_settlement_overview()
        pending_inflow = overview.pending_settlement_amount
        holdbacks = overview.total_discrepancy_amount

        projected_net = self.base_cash + pending_inflow - self.refund_buffer

        cash_position = CashPositionModel(
            currentAvailableCash=round(self.base_cash, 2),
            expectedSettlementsInflow=round(pending_inflow, 2),
            pendingGatewayHoldbacks=round(holdbacks, 2),
            refundObligations=round(self.refund_buffer, 2),
            projectedNetPosition=round(projected_net, 2),
            lastUpdated=datetime.now(timezone.utc).isoformat()
        )

        forecast: List[CashForecastDayModel] = []
        days_labels = ["Today", "Tomorrow", "+2 Days", "+3 Days", "+4 Days", "+5 Days", "+6 Days"]
        rolling_balance = self.base_cash

        daily_inflows = [
            pending_inflow * 0.7,
            pending_inflow * 0.3 + 45000.0,
            52000.0,
            61000.0,
            48000.0,
            73000.0,
            68000.0
        ]
        daily_outflows = [
            2500.0,
            18000.0,
            12000.0,
            8000.0,
            14000.0,
            9500.0,
            11000.0
        ]

        now = datetime.now()
        for i in range(7):
            day_dt = now + timedelta(days=i)
            date_str = day_dt.strftime("%d %b")
            inflow = daily_inflows[i]
            outflow = daily_outflows[i]
            rolling_balance = rolling_balance + inflow - outflow

            forecast.append(
                CashForecastDayModel(
                    date=date_str,
                    dayLabel=days_labels[i],
                    projectedInflow=round(inflow, 2),
                    projectedOutflow=round(outflow, 2),
                    projectedClosingBalance=round(rolling_balance, 2),
                    confidenceScore=95
                )
            )

        return cash_position, forecast

    def get_current_position(self) -> Dict[str, Any]:
        position, _ = self.calculate_cash_position_and_forecast()
        return {
            "current_available_cash": position.current_available_cash,
            "expected_settlements_inflow": position.expected_settlements_inflow,
            "pending_gateway_holdbacks": position.pending_gateway_holdbacks,
            "refund_obligations": position.refund_obligations,
            "projected_net_position": position.projected_net_position,
            "pending_settlements": position.expected_settlements_inflow
        }

    def get_forecast_days(self, days: int = 7) -> List[Dict[str, Any]]:
        _, forecast = self.calculate_cash_position_and_forecast()
        return [
            {
                "date": f.date,
                "day_label": f.day_label,
                "projected_inflow": f.projected_inflow,
                "projected_outflow": f.projected_outflow,
                "closing_balance": f.projected_closing_balance,
                "confidence_score": f.confidence_score
            }
            for f in forecast[:days]
        ]

cash_forecast_service = CashForecastService()

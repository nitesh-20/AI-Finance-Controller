from datetime import datetime, timedelta, timezone
from typing import List, Tuple, Dict, Any
from ..models.finance import CashPositionModel, CashForecastDayModel
from .settlement_service import settlement_service

class CashForecastService:
    def __init__(self, base_cash: float = 246500.0, refund_buffer: float = 12500.0):
        self.base_cash = base_cash
        self.refund_buffer = refund_buffer

    def calculate_cash_position_and_forecast(self, days: int = 7) -> Tuple[CashPositionModel, List[CashForecastDayModel]]:
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
        rolling_balance = self.base_cash

        base_inflows = [
            pending_inflow * 0.7,
            pending_inflow * 0.3 + 45000.0,
            52000.0,
            61000.0,
            48000.0,
            73000.0,
            68000.0,
            55000.0,
            49000.0,
            62000.0,
            58000.0,
            71000.0,
            64000.0,
            59000.0
        ]
        base_outflows = [
            2500.0,
            18000.0,
            12000.0,
            8000.0,
            14000.0,
            9500.0,
            11000.0,
            15000.0,
            10000.0,
            13000.0,
            8500.0,
            12000.0,
            9000.0,
            10500.0
        ]

        now = datetime.now()
        horizon = min(max(days, 1), 14)
        for i in range(horizon):
            day_dt = now + timedelta(days=i)
            date_str = day_dt.strftime("%d %b")
            day_label = "Today" if i == 0 else ("Tomorrow" if i == 1 else f"+{i} Days")
            
            # Base daily estimates
            raw_inflow = base_inflows[i] if i < len(base_inflows) else 50000.0
            raw_outflow = base_outflows[i] if i < len(base_outflows) else 10000.0
            
            # Weekend banking cycle adjustment: Indian bank settlements (NEFT/RTGS) pause on Sundays
            weekday = day_dt.weekday()  # 5 is Saturday, 6 is Sunday
            if weekday == 6:  # Sunday
                inflow = raw_inflow * 0.15  # Only instant UPI / IMPS settles
                outflow = raw_outflow * 0.40
            elif weekday == 0:  # Monday catch-up surge
                inflow = raw_inflow * 1.35
                outflow = raw_outflow * 1.10
            else:
                inflow = raw_inflow
                outflow = raw_outflow
                
            rolling_balance = rolling_balance + inflow - outflow
            
            # Volatility decay: confidence reduces slightly further into the forecast horizon
            confidence = max(98 - (i * 3) - (2 if weekday in [5, 6] else 0), 65)

            forecast.append(
                CashForecastDayModel(
                    date=date_str,
                    dayLabel=day_label,
                    projectedInflow=round(inflow, 2),
                    projectedOutflow=round(outflow, 2),
                    projectedClosingBalance=round(rolling_balance, 2),
                    confidenceScore=confidence
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

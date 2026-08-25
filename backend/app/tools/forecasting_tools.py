from typing import Dict, Any
from ..services.cash_forecast_service import cash_forecast_service

def tool_get_cash_position(args: Dict[str, Any] = None) -> Dict[str, Any]:
    """Retrieve current available merchant cash, expected payouts, and projected position."""
    cash_pos, _ = cash_forecast_service.calculate_cash_position_and_forecast()
    return {
        "available_cash": f"₹{cash_pos.current_available_cash:,.2f}",
        "expected_settlement_inflow": f"₹{cash_pos.expected_settlements_inflow:,.2f}",
        "pending_holdbacks": f"₹{cash_pos.pending_gateway_holdbacks:,.2f}",
        "refund_buffer": f"₹{cash_pos.refund_obligations:,.2f}",
        "projected_net_position": f"₹{cash_pos.projected_net_position:,.2f}"
    }

def tool_forecast_cash(args: Dict[str, Any] = None) -> Dict[str, Any]:
    """Retrieve 7-day daily forward cash forecast."""
    _, forecast = cash_forecast_service.calculate_cash_position_and_forecast()
    return {
        "forecast_days": [
            {
                "day": f.day_label,
                "date": f.date,
                "projected_closing": f"₹{f.projected_closing_balance:,.2f}",
                "inflow": f"₹{f.projected_inflow:,.2f}",
                "confidence": f"{f.confidence_score}%"
            }
            for f in forecast
        ]
    }

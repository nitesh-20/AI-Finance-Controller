"""
Forecasting Service
Forward cash-position projection, settlement pipeline analytics, and liquidity risk alerts.
"""
from typing import Dict, Any, List
from app.services.cash_forecast_service import cash_forecast_service, CashForecastService

class ForecastingService:
    def __init__(self):
        self.service = cash_forecast_service

    def get_current_cash_position(self) -> Dict[str, Any]:
        """Retrieve current settled liquidity and pipeline status."""
        return self.service.get_current_position()

    def get_cash_forecast(self, days: int = 7) -> List[Dict[str, Any]]:
        """Compute rolling deterministic cash forecast over N days."""
        return self.service.get_forecast_days(days=days)

forecasting_service = ForecastingService()

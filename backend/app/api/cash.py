from fastapi import APIRouter
from typing import List, Dict, Any
from ..models.finance import CashPositionModel, CashForecastDayModel
from ..services.cash_forecast_service import cash_forecast_service

router = APIRouter(prefix="/cash", tags=["Cash Position"])

@router.get("/position", response_model=CashPositionModel)
async def get_cash_position():
    """Get current available cash, pending inflows, and projected net liquidity."""
    cash_pos, _ = cash_forecast_service.calculate_cash_position_and_forecast()
    return cash_pos

@router.get("/forecast", response_model=List[CashForecastDayModel])
async def get_cash_forecast():
    """Get 7-day daily forward cash runway forecast."""
    _, forecast = cash_forecast_service.calculate_cash_position_and_forecast()
    return forecast

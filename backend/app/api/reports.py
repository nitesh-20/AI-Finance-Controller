from fastapi import APIRouter
from typing import Dict, Any
from ..services.report_service import report_service

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/summary", response_model=Dict[str, Any])
async def get_report_summary():
    """Get structured executive statutory report data."""
    return report_service.generate_full_executive_report()

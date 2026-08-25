from fastapi import APIRouter
from ..models.settlement import SettlementOverviewModel
from ..services.settlement_service import settlement_service

router = APIRouter(prefix="/settlements", tags=["Settlements"])

@router.get("", response_model=SettlementOverviewModel)
async def get_settlement_overview():
    """Get gross vs net settlements, fee deductions, and batches."""
    return settlement_service.get_settlement_overview()

@router.get("/batches")
async def get_settlement_batches():
    """Get itemized list of settlement payout batches."""
    return settlement_service.get_all_batches()

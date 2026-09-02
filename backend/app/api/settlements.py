from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query
from ..models.settlement import SettlementOverviewModel, SettlementRecordModel
from ..services.settlement_service import settlement_service

router = APIRouter(prefix="/settlements", tags=["Settlements"])

@router.get("", response_model=SettlementOverviewModel)
@router.get("/overview", response_model=SettlementOverviewModel)
async def get_settlement_overview():
    """Get gross vs net settlements, fee deductions, and batches."""
    return settlement_service.get_settlement_overview()

@router.get("/batches", response_model=List[SettlementRecordModel])
async def get_settlement_batches(
    status: Optional[str] = Query(None, description="Filter by status (settled, discrepancy, pending)"),
    search: Optional[str] = Query(None, description="Search by UTR or Settlement ID")
):
    """Get itemized list of settlement payout batches with optional filtering."""
    if status or search:
        return settlement_service.filter_batches(status=status, search=search)
    return settlement_service.get_all_batches()

@router.get("/batches/{settlement_id}", response_model=SettlementRecordModel)
async def get_settlement_batch_detail(settlement_id: str):
    """Retrieve detailed metadata for a specific settlement batch."""
    batch = settlement_service.get_batch_by_id(settlement_id)
    if not batch:
        raise HTTPException(status_code=404, detail=f"Settlement batch {settlement_id} not found")
    return batch


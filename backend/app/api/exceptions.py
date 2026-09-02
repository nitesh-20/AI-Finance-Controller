from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from ..models.exception import FinancialExceptionModel
from ..services.exception_service import exception_service
from ..services.audit_service import audit_service

router = APIRouter(prefix="/exceptions", tags=["Exceptions"])

class UpdateStatusRequest(BaseModel):
    status: str
    notes: Optional[str] = None

class BulkUpdateStatusRequest(BaseModel):
    exception_ids: List[str]
    status: str
    notes: Optional[str] = None

@router.get("", response_model=List[FinancialExceptionModel])
async def get_all_exceptions():
    """Get all isolated financial exceptions with evidence trails."""
    return exception_service.get_all_exceptions()

@router.post("/bulk-status", response_model=List[FinancialExceptionModel])
async def bulk_update_exception_status(body: BulkUpdateStatusRequest):
    """Batch update resolution status across multiple exceptions."""
    updated = exception_service.bulk_update_status(body.exception_ids, body.status, body.notes)
    audit_service.record_event(
        agent="ExceptionAgent",
        action=f"Bulk updated {len(updated)} exceptions to {body.status}",
        input_summary=f"IDs: {', '.join(body.exception_ids[:5])}...",
        result_summary=f"Updated {len(updated)} exceptions",
        status="SUCCESS"
    )
    return updated

@router.get("/{exc_id}", response_model=FinancialExceptionModel)
async def get_exception_detail(exc_id: str):
    """Get specific exception evidence by ID."""
    exc = exception_service.get_exception_by_id(exc_id)
    if not exc:
        raise HTTPException(status_code=404, detail="Exception not found")
    return exc

@router.post("/{exc_id}/status", response_model=FinancialExceptionModel)
async def update_exception_status(exc_id: str, body: UpdateStatusRequest):
    """Update exception resolution status (INVESTIGATING, RESOLVED, UNABLE_TO_RESOLVE)."""
    exc = exception_service.update_status(exc_id, body.status, body.notes)
    if not exc:
        raise HTTPException(status_code=404, detail="Exception not found")
    
    audit_service.record_event(
        agent="ExceptionAgent",
        action=f"Updated exception status to {body.status}",
        input_summary=f"Exception {exc.exception_code} notes: {body.notes or 'None'}",
        result_summary=f"New status: {body.status}",
        status="SUCCESS"
    )
    return exc


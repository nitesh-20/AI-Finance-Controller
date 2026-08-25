from fastapi import APIRouter
from typing import List
from ..models.agent import AuditEventModel
from ..services.audit_service import audit_service

router = APIRouter(prefix="/audit", tags=["Audit Ledger"])

@router.get("", response_model=List[AuditEventModel])
async def get_audit_ledger(limit: int = 50):
    """Get audit trail of AI agent operations and deterministic tool executions."""
    return audit_service.get_events(limit=limit)

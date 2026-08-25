from fastapi import APIRouter, HTTPException
from typing import List, Optional
from ..models.reconciliation import ReconciliationBatchResultModel
from ..models.auditor import TransactionAuditResultModel
from ..services.transaction_service import transaction_service
from ..services.reconciliation_engine import reconciliation_engine
from ..services.transaction_auditor import transaction_auditor

router = APIRouter(prefix="/reconciliation", tags=["Reconciliation"])

@router.get("/run", response_model=ReconciliationBatchResultModel)
async def run_reconciliation():
    """Execute deterministic 10-step payment reconciliation over the 52-record batch."""
    records = transaction_service.get_all_records()
    result = reconciliation_engine.reconcile_batch(records)
    return result

@router.get("/metrics")
async def get_reconciliation_metrics():
    """Get calculated match rate, throughput duration, and reconciled totals."""
    records = transaction_service.get_all_records()
    result = reconciliation_engine.reconcile_batch(records)
    return result.metrics

@router.get("/records")
async def get_processed_records():
    """Get all processed records with classification tags and discrepancy amounts."""
    records = transaction_service.get_all_records()
    result = reconciliation_engine.reconcile_batch(records)
    return result.records

@router.get("/audit/{txn_id}", response_model=TransactionAuditResultModel)
async def get_transaction_audit(txn_id: str, contracted_mdr: Optional[float] = None, tds_rate: float = 0.0):
    """
    Get transparent transaction audit with financial waterfall, root cause diagnosis,
    confidence rating, evidence, and 10-step audit trail.
    """
    record = transaction_service.get_record_by_id(txn_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Transaction {txn_id} not found")
    
    audit_res = transaction_auditor.audit_transaction(record, contracted_mdr=contracted_mdr, tds_rate=tds_rate)
    return audit_res

@router.get("/audits", response_model=List[TransactionAuditResultModel])
async def get_all_transaction_audits():
    """Get complete transaction audit list across current batch."""
    records = transaction_service.get_all_records()
    return transaction_auditor.audit_all_transactions(records)

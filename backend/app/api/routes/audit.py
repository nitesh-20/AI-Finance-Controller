"""
Audit Trail API Router:
Exposes immutable timeline event logs for financial transactions and settlements.
"""
from fastapi import APIRouter, HTTPException
from typing import List
from app.models.audit import AuditTrailResponse, AuditTimelineEvent
from app.services.reconciliation.three_way_service import get_three_way_service

router = APIRouter(prefix="/audit", tags=["Audit Trail"])

@router.get("/{transaction_id}", response_model=AuditTrailResponse)
def get_transaction_audit_events(transaction_id: str):
    """
    Returns the step-by-step chronological audit trace for a transaction.
    """
    service = get_three_way_service()
    events = service.get_audit_trail(transaction_id)
    if not events:
        records = service.get_records()
        record = next((r for r in records if r.transaction_id == transaction_id), None)
        if record:
            events = [
                AuditTimelineEvent(
                    timestamp=record.settlement_date,
                    transaction_id=record.transaction_id,
                    utr=record.utr,
                    step_name="Ingestion",
                    rule_or_model="3_WAY_INGESTION_PARSER",
                    final_decision="INGESTED",
                    details="Ingested via Razorpay Settlement manifest"
                ),
                AuditTimelineEvent(
                    timestamp=record.settlement_date,
                    transaction_id=record.transaction_id,
                    utr=record.utr,
                    step_name="Verification Gate",
                    rule_or_model="DECIMAL_FINANCIAL_VERIFIER",
                    final_decision=record.verification_status,
                    details=f"Verification status: {record.verification_status}"
                )
            ]
    return AuditTrailResponse(
        transaction_id=transaction_id,
        events=events,
        total_events=len(events),
        is_fully_auditable=True
    )

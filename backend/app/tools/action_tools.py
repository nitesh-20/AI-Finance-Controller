from typing import Dict, Any
from ..models.health import ActionExecutionRequest
from ..services.action_service import action_service
from ..services.transaction_auditor import transaction_auditor
from ..services.transaction_service import transaction_service

def tool_execute_action(transaction_id: str, action_type: str, notes: str = None) -> Dict[str, Any]:
    """Execute a simulated resolution action (DISPUTE_RAZORPAY, JOURNAL_ADJUSTMENT, QUARANTINE, REFUND_DUPLICATE)."""
    req = ActionExecutionRequest(
        transactionId=transaction_id,
        actionType=action_type,
        notes=notes
    )
    res = action_service.execute_action(req)
    return {
        "success": res.success,
        "action_id": res.action_id,
        "transaction_id": res.transaction_id,
        "action_type": res.action_type,
        "message": res.message,
        "health_score_before": res.health_score_before,
        "health_score_after": res.health_score_after,
        "health_score_delta": f"{'+' if res.health_score_delta >= 0 else ''}{res.health_score_delta} pts",
        "verification": {
            "previous_variance": f"₹{res.verification.previous_variance:,.2f}",
            "new_variance": f"₹{res.verification.new_variance:,.2f}",
            "variance_cleared": f"₹{res.verification.variance_cleared:,.2f}",
            "status": res.verification.new_status
        }
    }

def tool_verify_resolution(transaction_id: str) -> Dict[str, Any]:
    """Re-run deterministic reconciliation audit for a specific transaction to verify variance reduction."""
    record = transaction_service.get_record_by_id(transaction_id)
    if not record:
        return {"error": f"Transaction {transaction_id} not found"}
    
    audit_res = transaction_auditor.audit_transaction(record)
    return {
        "transaction_id": transaction_id,
        "reconciliation_status": audit_res.reconciliation_status,
        "variance_amount": f"₹{audit_res.variance_amount:,.2f}",
        "root_cause": audit_res.root_cause,
        "is_cleared": audit_res.variance_amount <= 0.05
    }

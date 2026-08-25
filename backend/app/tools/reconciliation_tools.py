from typing import Dict, Any
from ..services.transaction_service import transaction_service
from ..services.reconciliation_engine import reconciliation_engine

def tool_reconcile_transactions(args: Dict[str, Any] = None) -> Dict[str, Any]:
    """Execute deterministic 10-step payment reconciliation over current merchant batch."""
    records = transaction_service.get_all_records()
    result = reconciliation_engine.reconcile_batch(records)
    return {
        "total_records": result.metrics.total_records_processed,
        "matched_count": result.metrics.matched_count,
        "exceptions_count": result.metrics.exceptions_count,
        "match_rate": f"{result.metrics.match_rate_percentage}%",
        "total_gross_processed": f"₹{result.metrics.total_gross_processed:,.2f}",
        "total_reconciled": f"₹{result.metrics.total_reconciled_amount:,.2f}",
        "total_exception_variance": f"₹{result.metrics.total_exception_amount:,.2f}",
        "status": "COMPLETED"
    }

def tool_get_exceptions(args: Dict[str, Any] = None) -> Dict[str, Any]:
    """Retrieve all active financial exceptions and variance details."""
    records = transaction_service.get_all_records()
    result = reconciliation_engine.reconcile_batch(records)
    return {
        "count": len(result.exceptions),
        "exceptions": [
            {
                "code": e.exception_code,
                "type": e.type,
                "txn_id": e.transaction_id,
                "severity": e.severity,
                "variance": f"₹{e.difference:,.2f}",
                "explanation": e.ai_explanation
            }
            for e in result.exceptions
        ]
    }

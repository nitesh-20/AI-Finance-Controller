"""
Reconciliation Service
Provides high-level reconciliation workflows, batch execution, and status aggregation.
"""
from typing import Dict, Any, List
from app.services.reconciliation_engine import reconciliation_engine, ReconciliationEngine
from app.services.transaction_auditor import transaction_auditor

class ReconciliationService:
    def __init__(self):
        self.engine = reconciliation_engine
        self.auditor = transaction_auditor

    def run_reconciliation(self) -> Dict[str, Any]:
        """Execute full deterministic reconciliation pass over transactions and settlements."""
        return self.engine.run_reconciliation()

    def get_summary(self) -> Dict[str, Any]:
        """Get summarized reconciliation metrics."""
        recon_result = self.engine.run_reconciliation()
        return {
            "total_transactions": recon_result.get("total_transactions", 0),
            "matched_count": recon_result.get("matched_count", 0),
            "exception_count": recon_result.get("mismatched_count", 0),
            "match_rate": recon_result.get("match_rate_percentage", 0.0),
            "total_variance": recon_result.get("total_variance", 0.0),
            "status": "HEALTHY" if recon_result.get("match_rate_percentage", 0.0) > 90 else "DEGRADED"
        }

    def get_discrepancies(self) -> List[Dict[str, Any]]:
        """Retrieve list of identified transaction discrepancies."""
        audit_res = self.auditor.audit_all_transactions()
        return [
            audit.dict() for audit in audit_res.get("audits", [])
            if audit.status != "MATCHED"
        ]

reconciliation_service = ReconciliationService()

"""
Audit Agent
Specialized agent for producing full explainability traces, mathematical proofs, and compliance logs.
"""
from typing import Dict, Any, List
from app.services.audit_service import audit_service
from app.services.transaction_auditor import transaction_auditor

class AuditAgent:
    def explain_transaction(self, transaction_id: str) -> Dict[str, Any]:
        """Produce deterministic mathematical audit steps and root-cause justification for a specific transaction."""
        audit_res = transaction_auditor.audit_single_transaction(transaction_id)
        if not audit_res:
            return {
                "agent": "AuditAgent",
                "error": f"Transaction {transaction_id} not found in settlement ledger."
            }
        
        return {
            "agent": "AuditAgent",
            "transaction_id": transaction_id,
            "status": audit_res.status,
            "gross_amount": audit_res.gross_amount,
            "actual_settled": audit_res.actual_settled,
            "expected_settled": audit_res.expected_settled,
            "variance": audit_res.variance,
            "root_cause": audit_res.root_cause,
            "confidence": audit_res.confidence,
            "audit_steps": audit_res.audit_steps,
            "recommended_action": audit_res.recommended_action
        }

    def get_audit_trail(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Retrieve recent immutable audit logs."""
        return audit_service.get_recent_logs(limit=limit)

audit_agent = AuditAgent()

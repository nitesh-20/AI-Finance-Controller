"""
Reconciliation Agent
Specialized agent focused on comparing payment gateway transaction records against bank settlement batches,
identifying matching anomalies, and calculating precise variances.
"""
from typing import Dict, Any, List
from app.services.reconciliation_service import reconciliation_service
from app.services.transaction_auditor import transaction_auditor

class ReconciliationAgent:
    def analyze_reconciliation(self) -> Dict[str, Any]:
        """Perform comprehensive reconciliation analysis and return structured diagnostic findings."""
        summary = reconciliation_service.get_summary()
        discrepancies = reconciliation_service.get_discrepancies()
        
        findings = []
        if summary["match_rate"] < 95.0:
            findings.append(f"Reconciliation rate is at {summary['match_rate']}%, which is below the 95% SLA benchmark.")
        if summary["total_variance"] > 0:
            findings.append(f"Cumulative unreconciled variance stands at ₹{summary['total_variance']:,.2f} across {summary['exception_count']} transactions.")

        return {
            "agent": "ReconciliationAgent",
            "summary": summary,
            "findings": findings,
            "discrepancy_sample": discrepancies[:5],
            "recommended_focus": "Review top 3 high-severity MDR and Missing Settlement exceptions."
        }

reconciliation_agent = ReconciliationAgent()

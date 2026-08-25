"""
Exception Agent
Specialized agent for root-cause classification, exception prioritization, and resolution recommendation.
"""
from typing import Dict, Any, List
from app.services.exception_service import exception_service
from app.services.transaction_auditor import transaction_auditor

class ExceptionAgent:
    def prioritize_exceptions(self) -> Dict[str, Any]:
        """Classify and prioritize all open exceptions by risk severity and financial impact."""
        summary = exception_service.get_exception_summary()
        active_exceptions = exception_service.get_active_exceptions()
        
        # Sort by variance exposure descending
        prioritized = sorted(active_exceptions, key=lambda x: abs(x.get("variance", 0)), reverse=True)
        
        high_severity = [e for e in prioritized if e.get("severity") == "CRITICAL" or e.get("severity") == "HIGH"]
        
        return {
            "agent": "ExceptionAgent",
            "summary": summary,
            "total_open": len(active_exceptions),
            "critical_count": len(high_severity),
            "priority_queue": prioritized[:10],
            "top_root_causes": summary.get("by_type", {})
        }

exception_agent = ExceptionAgent()

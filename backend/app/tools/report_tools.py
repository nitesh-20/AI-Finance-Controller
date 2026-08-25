from typing import Dict, Any
from ..services.report_service import report_service

def tool_generate_report(args: Dict[str, Any] = None) -> Dict[str, Any]:
    """Generate statutory executive reconciliation report."""
    report = report_service.generate_full_executive_report()
    return {
        "status": "GENERATED",
        "entity": report["entity"],
        "match_rate": f"{report['metrics']['matchRatePercentage']}%",
        "total_reconciled": f"₹{report['metrics']['totalReconciledAmount']:,.2f}",
        "executive_summary": report["executiveSummary"]
    }

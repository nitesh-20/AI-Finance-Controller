from typing import Dict, Any, List
from ..services.health_service import health_service

def tool_calculate_finance_health(args: Dict[str, Any] = None) -> Dict[str, Any]:
    """Calculate the comprehensive Finance Health Score across reconciliation, settlements, exceptions, and cash."""
    score = health_service.calculate_health_score()
    return {
        "overall_score": f"{score.overall_score}/100",
        "reconciliation_score": f"{score.reconciliation_score}/100",
        "settlement_score": f"{score.settlement_score}/100",
        "exception_score": f"{score.exception_score}/100",
        "cash_score": f"{score.cash_position_score}/100",
        "score_change": f"{'+' if score.score_change >= 0 else ''}{score.score_change} pts",
        "reason_for_change": score.reason_for_change
    }

def tool_rank_financial_risks(args: Dict[str, Any] = None) -> Dict[str, Any]:
    """Rank open financial exceptions and anomalies by monetary impact, severity, and urgency."""
    items = health_service.get_attention_queue()
    return {
        "count": len(items),
        "attention_items": [
            {
                "transaction_id": item.transaction_id,
                "amount": f"₹{item.amount:,.2f}",
                "category": item.category,
                "severity": item.severity,
                "impact_level": item.impact_level,
                "days_unresolved": item.days_unresolved,
                "recommendation": item.recommendation,
                "suggested_action": item.action_type
            }
            for item in items
        ]
    }

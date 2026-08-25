from typing import Dict, Any
from ..services.settlement_service import settlement_service

def tool_get_settlements(args: Dict[str, Any] = None) -> Dict[str, Any]:
    """Retrieve settlement overview, payout batches, and fee deduction variances."""
    overview = settlement_service.get_settlement_overview()
    return {
        "gross_settled": f"₹{overview.total_gross_settled:,.2f}",
        "net_received": f"₹{overview.total_net_received:,.2f}",
        "fees_deducted": f"₹{overview.total_fees_deducted:,.2f}",
        "gst_deducted": f"₹{overview.total_gst_deducted:,.2f}",
        "pending_settlement": f"₹{overview.pending_settlement_amount:,.2f}",
        "total_discrepancies": f"₹{overview.total_discrepancy_amount:,.2f}",
        "batches_count": len(overview.batches)
    }

def tool_get_settlement_discrepancies(args: Dict[str, Any] = None) -> Dict[str, Any]:
    """Retrieve detailed discrepancy breakdown across settlement batches."""
    overview = settlement_service.get_settlement_overview()
    discrepancies = [b for b in overview.batches if b.difference != 0]
    return {
        "count": len(discrepancies),
        "discrepancies": [
            {
                "settlement_id": b.settlement_id,
                "date": b.settlement_date,
                "variance": f"₹{abs(b.difference):,.2f}",
                "reason": b.discrepancy_reason,
                "utr": b.utr_number
            }
            for b in discrepancies
        ]
    }

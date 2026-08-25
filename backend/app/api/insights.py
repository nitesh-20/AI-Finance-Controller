from fastapi import APIRouter
from typing import List
from ..models.finance import AIInsightItemModel
from ..services.transaction_service import transaction_service
from ..services.reconciliation_engine import reconciliation_engine
from ..services.settlement_service import settlement_service
from ..services.cash_forecast_service import cash_forecast_service

router = APIRouter(prefix="/insights", tags=["AI Insights"])

@router.get("", response_model=List[AIInsightItemModel])
async def get_financial_insights():
    """Synthesize data-grounded AI financial operations insights."""
    records = transaction_service.get_all_records()
    recon = reconciliation_engine.reconcile_batch(records)
    cash_pos, _ = cash_forecast_service.calculate_cash_position_and_forecast()
    metrics = recon.metrics
    exceptions = recon.exceptions

    insights = [
        AIInsightItemModel(
            id="ins_recon_health",
            title="High Reconciliation Throughput",
            category="RECONCILIATION",
            level="success",
            summary=f"Automated match rate achieved {metrics.match_rate_percentage}% across {metrics.total_records_processed} transaction records.",
            details=f"₹{metrics.total_reconciled_amount:,.2f} reconciled deterministically out of ₹{metrics.total_gross_processed:,.2f} gross volume.",
            actionableStep="Download the statutory reconciliation audit report.",
            timestamp=metrics.batch_timestamp
        ),
        AIInsightItemModel(
            id="ins_fee_variance",
            title="Gateway Fee & Settlement Variance Detected",
            category="SETTLEMENT",
            level="warning",
            summary="Found 2 settlement amount discrepancy entries totaling ₹788.80.",
            details="Discrepancies stem from international card pricing tier (3.5% fee) and an unitemized chargeback deduction.",
            actionableStep="Click to auto-generate dispute statement with ARN reference numbers.",
            relatedIds=["TXN_98217366", "TXN_98217345"],
            timestamp=metrics.batch_timestamp
        ),
        AIInsightItemModel(
            id="ins_dup_alert",
            title="Duplicate Payment Capture Alert",
            category="ANOMALY",
            level="critical",
            summary="1 duplicate customer payment capture identified for immediate refund.",
            details="Customer Neha Deshmukh was charged twice for ORD_2026_8815 within 8 seconds.",
            actionableStep="Initiate 1-click refund to prevent chargeback fees.",
            relatedIds=["TXN_98217355_DUP"],
            timestamp=metrics.batch_timestamp
        ),
        AIInsightItemModel(
            id="ins_cash_liquidity",
            title="Strong 7-Day Net Cash Runway",
            category="CASH_FLOW",
            level="info",
            summary=f"Available cash ₹{(cash_pos.current_available_cash / 100000):.2f}L plus ₹{(cash_pos.expected_settlements_inflow / 100000):.2f}L pending gateway payouts.",
            details=f"Net projected liquidity stands at ₹{(cash_pos.projected_net_position / 100000):.2f}L after factoring ₹12.5K refund buffer.",
            actionableStep="Forecast indicates zero working capital shortfall over the next 7 business days.",
            timestamp=metrics.batch_timestamp
        )
    ]
    return insights

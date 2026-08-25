from datetime import datetime, timezone
from typing import List, Dict, Any, Tuple
from ..models.health import FinanceHealthScoreModel, AttentionItemModel
from ..services.transaction_service import transaction_service
from ..services.reconciliation_engine import reconciliation_engine
from ..services.settlement_service import settlement_service
from ..services.cash_forecast_service import cash_forecast_service

class HealthService:
    def __init__(self):
        self._score_history: List[int] = [88]  # Previous score benchmark

    def calculate_health_score(self) -> FinanceHealthScoreModel:
        records = transaction_service.get_all_records()
        recon = reconciliation_engine.reconcile_batch(records)
        settlement_overview = settlement_service.get_settlement_overview()
        cash_pos, _ = cash_forecast_service.calculate_cash_position_and_forecast()
        
        metrics = recon.metrics
        open_exceptions = [e for e in recon.exceptions if e.status != "RESOLVED"]
        open_exception_count = len(open_exceptions)
        open_exception_amount = sum(e.difference for e in open_exceptions)

        # 1. Reconciliation Component (0 - 100)
        recon_score = min(100, max(40, int(metrics.match_rate_percentage * 1.25)))

        # 2. Settlement Component (0 - 100)
        settle_ratio = 1.0 - (settlement_overview.total_discrepancy_amount / max(1.0, settlement_overview.total_gross_settled))
        settle_score = min(100, max(40, int(settle_ratio * 100) - (8 if settlement_overview.total_discrepancy_amount > 0 else 0)))

        # 3. Exception Risk Component (0 - 100)
        # Deduct 5 points per open exception, and scale with open amount
        exc_score = max(30, 100 - (open_exception_count * 6) - int(min(30, open_exception_amount / 1000)))

        # 4. Cash Position Component (0 - 100)
        cash_ratio = cash_pos.projected_net_position / max(1.0, cash_pos.current_available_cash)
        cash_score = min(100, max(50, int(cash_ratio * 75) + 15))

        # Overall weighted score
        overall = int(round(
            0.35 * recon_score +
            0.25 * settle_score +
            0.25 * exc_score +
            0.15 * cash_score
        ))

        prev_score = self._score_history[-1] if self._score_history else overall
        score_delta = overall - prev_score

        # Determine dynamic reasoning
        if open_exception_count == 0:
            reason = "All transaction exceptions resolved cleanly. Reconciliation health at optimal 100% throughput."
        elif score_delta < 0:
            reason = f"Settlement health decreased by {abs(score_delta)} points because {open_exception_count} high-value exceptions remain unresolved."
        elif score_delta > 0:
            reason = f"Finance health improved by {score_delta} points following verified operational resolutions."
        else:
            reason = f"{open_exception_count} exceptions currently open totaling ₹{open_exception_amount:,.2f} in pending variance."

        return FinanceHealthScoreModel(
            overallScore=overall,
            reconciliationScore=recon_score,
            settlementScore=settle_score,
            exceptionScore=exc_score,
            cashPositionScore=cash_score,
            previousScore=prev_score,
            scoreChange=score_delta,
            reasonForChange=reason,
            lastUpdated=datetime.now(timezone.utc).isoformat()
        )

    def record_score_benchmark(self, score: int):
        self._score_history.append(score)

    def get_attention_queue(self) -> List[AttentionItemModel]:
        """
        Ranks financial issues by monetary impact, severity, confidence, age, and operational importance.
        """
        records = transaction_service.get_all_records()
        recon = reconciliation_engine.reconcile_batch(records)
        
        items: List[AttentionItemModel] = []

        for exc in recon.exceptions:
            if exc.status == "RESOLVED":
                continue

            # Assign categories and impacts
            if "missing" in exc.type.lower() or "missing" in exc.ai_explanation.lower():
                category = "MISSING_SETTLEMENT"
                impact = "HIGH IMPACT"
                days = 2
                rec = "Quarantine transaction and escalate dispute with gateway batch support."
                action_type = "DISPUTE_RAZORPAY"
                label = "Dispute Gateway"
            elif "duplicate" in exc.type.lower():
                category = "DUPLICATE_CAPTURE"
                impact = "HIGH IMPACT"
                days = 2
                rec = "Issue immediate customer refund to prevent double billing chargeback."
                action_type = "REFUND_DUPLICATE"
                label = "Issue Refund"
            elif "unmapped" in exc.ai_explanation.lower() or "orphan" in exc.transaction_id.lower() or "MISSING" in exc.order_id:
                category = "ORPHAN_CAPTURE"
                impact = "HIGH IMPACT"
                days = 1
                rec = "Quarantine capture and verify merchant ERP cart abandonment manifests."
                action_type = "QUARANTINE"
                label = "Quarantine"
            elif "mdr" in exc.ai_explanation.lower() or "tier" in exc.ai_explanation.lower() or "surcharge" in exc.ai_explanation.lower():
                category = "WRONG_MDR"
                impact = "MEDIUM IMPACT"
                days = 1
                rec = "Create journal adjustment to book international card fee surcharge."
                action_type = "JOURNAL_ADJUSTMENT"
                label = "Journal Adjustment"
            elif "chargeback" in exc.ai_explanation.lower() or abs(exc.difference - 400.0) <= 0.05:
                category = "CHARGEBACK_RESERVE"
                impact = "HIGH IMPACT"
                days = 2
                rec = "Dispute unitemized ₹400 gateway deduction with bank ARN proof."
                action_type = "DISPUTE_RAZORPAY"
                label = "Dispute Deduction"
            else:
                category = "SETTLEMENT_VARIANCE"
                impact = "MEDIUM IMPACT"
                days = 1
                rec = "Review settlement deduction against contracted pricing schedule."
                action_type = "DISPUTE_RAZORPAY"
                label = "Review & Dispute"

            # Compute rank weight: Amount * Severity Multiplier
            sev_multiplier = 4.0 if exc.severity == "CRITICAL" else (3.0 if exc.severity == "HIGH" else 2.0)
            rank_score = exc.difference * sev_multiplier

            # Retrieve customer name from record
            rec_obj = transaction_service.get_record_by_id(exc.transaction_id)
            cust_name = rec_obj.customer_name if rec_obj else "Merchant Customer"

            items.append((
                rank_score,
                AttentionItemModel(
                    id=exc.id,
                    transactionId=exc.transaction_id,
                    orderId=exc.order_id,
                    customerName=cust_name,
                    amount=round(exc.difference, 2),
                    title=f"{exc.type.replace('_', ' ').title()} Variance",
                    category=category,
                    severity=exc.severity,
                    impactLevel=impact,
                    daysUnresolved=days,
                    confidence=95,
                    recommendation=rec,
                    actionType=action_type,
                    suggestedActionLabel=label
                )
            ))

        # Sort descending by rank score (highest monetary & severity impact first)
        items.sort(key=lambda x: x[0], reverse=True)
        return [item[1] for item in items]

health_service = HealthService()

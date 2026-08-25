from datetime import datetime, timezone
from typing import Dict, Any
from .transaction_service import transaction_service
from .reconciliation_engine import reconciliation_engine
from .settlement_service import settlement_service
from .cash_forecast_service import cash_forecast_service

class ReportService:
    def generate_full_executive_report(self) -> Dict[str, Any]:
        records = transaction_service.get_all_records()
        recon = reconciliation_engine.reconcile_batch(records)
        settlement_overview = settlement_service.get_settlement_overview()
        cash_pos, forecast = cash_forecast_service.calculate_cash_position_and_forecast()

        return {
            "entity": "Bharat Merchants Ltd.",
            "gstin": "27AABCB1234F1Z5",
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "batchWindow": "Aug 18 – Aug 21, 2026",
            "metrics": recon.metrics.model_dump(by_alias=True),
            "settlements": settlement_overview.model_dump(by_alias=True),
            "cashPosition": cash_pos.model_dump(by_alias=True),
            "forecast": [f.model_dump(by_alias=True) for f in forecast],
            "exceptions": [e.model_dump(by_alias=True) for e in recon.exceptions],
            "executiveSummary": (
                f"Automated reconciliation successfully verified {recon.metrics.matched_count} of "
                f"{recon.metrics.total_records_processed} transaction records ({recon.metrics.match_rate_percentage}% match rate). "
                f"Total gross volume of ₹{recon.metrics.total_gross_processed:,.2f} resulted in ₹{recon.metrics.total_reconciled_amount:,.2f} "
                f"reconciled clean payouts. {len(recon.exceptions)} exceptions isolated totaling ₹{recon.metrics.total_exception_amount:,.2f}."
            )
        }

report_service = ReportService()

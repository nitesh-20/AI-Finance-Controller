"""
Variance Service
Deterministic calculation and analysis of theoretical vs actual settlement variances,
root-cause distribution, and financial exposure.
"""
from typing import Dict, Any, List
from collections import defaultdict
from app.services.transaction_auditor import transaction_auditor

class VarianceService:
    def __init__(self):
        self.auditor = transaction_auditor

    def calculate_variance(
        self,
        gross_amount: float,
        mdr_rate: float,
        gst_rate: float = 0.18,
        tds_rate: float = 0.0,
        other_adjustments: float = 0.0,
        actual_settled: float = 0.0
    ) -> Dict[str, float]:
        """
        Deterministic Financial Formula:
        Theoretical MDR = Gross * MDR Rate
        Theoretical GST = Theoretical MDR * GST Rate
        Theoretical TDS = Gross * TDS Rate
        Theoretical Net = Gross - Theoretical MDR - Theoretical GST - Theoretical TDS - Adjustments
        Variance = Theoretical Net - Actual Settled
        """
        mdr_amount = round(gross_amount * mdr_rate, 2)
        gst_amount = round(mdr_amount * gst_rate, 2)
        tds_amount = round(gross_amount * tds_rate, 2)
        theoretical_net = round(gross_amount - mdr_amount - gst_amount - tds_amount - other_adjustments, 2)
        variance = round(theoretical_net - actual_settled, 2)

        return {
            "gross_amount": gross_amount,
            "mdr_rate": mdr_rate,
            "mdr_amount": mdr_amount,
            "gst_rate": gst_rate,
            "gst_amount": gst_amount,
            "tds_amount": tds_amount,
            "other_adjustments": other_adjustments,
            "theoretical_net": theoretical_net,
            "actual_settled": actual_settled,
            "variance": variance
        }

    def get_variance_breakdown(self) -> Dict[str, Any]:
        """Categorize system-wide variance by root cause and calculate total risk."""
        audits = self.auditor.audit_all_transactions()
        
        breakdown = defaultdict(lambda: {"count": 0, "total_variance": 0.0, "transactions": []})
        total_positive_variance = 0.0
        total_negative_variance = 0.0
        total_variance_sum = 0.0

        for a in audits:
            if a.reconciliation_status != "MATCHED":
                rc = a.root_cause or "UNKNOWN"
                var = a.variance_amount
                breakdown[rc]["count"] += 1
                breakdown[rc]["total_variance"] = round(breakdown[rc]["total_variance"] + abs(var), 2)
                breakdown[rc]["transactions"].append(a.transaction_id)
                total_variance_sum += abs(var)
                
                if var > 0:
                    total_positive_variance += var
                else:
                    total_negative_variance += abs(var)

        return {
            "total_exceptions": sum(item["count"] for item in breakdown.values()),
            "net_variance": round(total_variance_sum, 2),
            "total_positive_variance": round(total_positive_variance, 2),
            "total_negative_variance": round(total_negative_variance, 2),
            "by_root_cause": dict(breakdown)
        }

variance_service = VarianceService()

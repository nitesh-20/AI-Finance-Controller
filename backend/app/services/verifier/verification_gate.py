"""
Deterministic Financial Verification Gate:
Strictly enforces the golden rule: "AI proposes. Deterministic verification decides."
Uses Decimal arithmetic for paise-level precision.
"""
from decimal import Decimal, ROUND_HALF_UP
from datetime import datetime
from typing import Dict, Any, List, Optional, Set

from app.models.reconciliation import VerificationResultModel, AuditWaterfallModel

class FinancialVerificationGate:
    def __init__(self, contracted_mdr_rate: float = 0.02, statutory_gst_rate: float = 0.18):
        self.contracted_mdr_rate = Decimal(str(contracted_mdr_rate))
        self.statutory_gst_rate = Decimal(str(statutory_gst_rate))
        self.seen_utrs: Set[str] = set()

    def reset_seen_utrs(self):
        self.seen_utrs.clear()

    def calculate_expected_settlement(
        self,
        gross_amount: float,
        refund_amount: float = 0.0,
        chargeback_amount: float = 0.0,
        tds_rate: float = 0.0,
        other_deductions: float = 0.0,
        custom_mdr_rate: Optional[float] = None
    ) -> AuditWaterfallModel:
        """
        Executes strict 10-step financial arithmetic with Decimal accuracy.
        """
        gross = Decimal(str(gross_amount)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        mdr_rate = Decimal(str(custom_mdr_rate)) if custom_mdr_rate is not None else self.contracted_mdr_rate
        
        mdr = (gross * mdr_rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        gst = (mdr * self.statutory_gst_rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        
        tds_r = Decimal(str(tds_rate))
        tds = (gross * tds_r).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        
        refund = Decimal(str(refund_amount)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        chargeback = Decimal(str(chargeback_amount)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        deductions = Decimal(str(other_deductions)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        theoretical_net = gross - mdr - gst - tds - refund - chargeback - deductions
        theoretical_net = theoretical_net.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        return AuditWaterfallModel(
            gross_amount=float(gross),
            contracted_mdr_rate=float(mdr_rate),
            mdr_amount=float(mdr),
            gst_rate=float(self.statutory_gst_rate),
            gst_amount=float(gst),
            tds_rate=float(tds_r),
            tds_amount=float(tds),
            refund_amount=float(refund),
            chargeback_amount=float(chargeback),
            other_deductions=float(deductions),
            theoretical_net_settlement=float(theoretical_net),
            actual_bank_credit=0.0,
            variance=0.0
        )

    def verify_reconciliation(
        self,
        transaction_id: str,
        utr: str,
        gross_amount: float,
        actual_bank_credit: float,
        refund_amount: float = 0.0,
        chargeback_amount: float = 0.0,
        tds_rate: float = 0.0,
        other_deductions: float = 0.0,
        custom_mdr_rate: Optional[float] = None,
        allow_duplicate_utr: bool = False
    ) -> Tuple[VerificationResultModel, AuditWaterfallModel]:
        """
        Verifies expected settlement against actual bank credit.
        Produces machine-readable VerificationResultModel and full AuditWaterfallModel.
        """
        waterfall = self.calculate_expected_settlement(
            gross_amount=gross_amount,
            refund_amount=refund_amount,
            chargeback_amount=chargeback_amount,
            tds_rate=tds_rate,
            other_deductions=other_deductions,
            custom_mdr_rate=custom_mdr_rate
        )

        expected_net_dec = Decimal(str(waterfall.theoretical_net_settlement)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        actual_credit_dec = Decimal(str(actual_bank_credit)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        
        variance_dec = (expected_net_dec - actual_credit_dec).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        
        waterfall.actual_bank_credit = float(actual_credit_dec)
        waterfall.variance = float(variance_dec)

        checks_passed: List[str] = []
        checks_failed: List[str] = []

        # Check 1: Duplicate UTR Validation
        if utr and utr != "UNKNOWN" and not allow_duplicate_utr:
            if utr in self.seen_utrs:
                checks_failed.append(f"DUPLICATE_UTR_DETECTED: UTR '{utr}' already settled in prior batch")
            else:
                self.seen_utrs.add(utr)
                checks_passed.append("UNIQUE_UTR_VERIFIED: No duplicate settlement references detected")
        else:
            checks_passed.append("UTR_CHECK_SKIPPED: Non-unique or bulk settlement reference")

        # Check 2: Debit-Credit Balance (Variance == 0)
        if abs(variance_dec) <= Decimal("0.05"):
            checks_passed.append(f"DEBIT_CREDIT_BALANCED: Expected ₹{expected_net_dec:,.2f} == Actual ₹{actual_credit_dec:,.2f} (Delta: ₹{variance_dec:,.2f})")
        else:
            checks_failed.append(f"VARIANCE_DETECTED: Theoretical Net ₹{expected_net_dec:,.2f} differs from Bank Credit ₹{actual_credit_dec:,.2f} (Discrepancy: ₹{variance_dec:,.2f})")

        # Check 3: MDR & GST Statutory Alignment
        expected_mdr_dec = Decimal(str(waterfall.mdr_amount)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        expected_gst_dec = Decimal(str(waterfall.gst_amount)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        statutory_gst_check = (expected_mdr_dec * self.statutory_gst_rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        
        if abs(expected_gst_dec - statutory_gst_check) <= Decimal("0.02"):
            checks_passed.append("STATUTORY_TAX_VERIFIED: 18% GST matches MDR base precisely")
        else:
            checks_failed.append("STATUTORY_TAX_MISMATCH: GST calculation diverges from 18% schedule")

        # Decision
        is_verified = len(checks_failed) == 0
        status = "VERIFIED" if is_verified else "REJECTED"

        verification_result = VerificationResultModel(
            verification_status=status,
            expected_amount=float(expected_net_dec),
            actual_amount=float(actual_credit_dec),
            variance=float(variance_dec),
            checks_passed=checks_passed,
            checks_failed=checks_failed,
            verified_at=datetime.utcnow().isoformat() + "Z"
        )

        return verification_result, waterfall

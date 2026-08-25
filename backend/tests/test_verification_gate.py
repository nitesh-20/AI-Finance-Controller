"""
Unit Tests for Deterministic Financial Verification Gate:
Tests Decimal arithmetic, 18% GST calculation, Duplicate UTR rejection, and Rejecting incorrect AI proposals.
"""
import unittest
from app.services.verifier.verification_gate import FinancialVerificationGate

class TestVerificationGate(unittest.TestCase):
    def setUp(self):
        self.verifier = FinancialVerificationGate(contracted_mdr_rate=0.02, statutory_gst_rate=0.18)
        self.verifier.reset_seen_utrs()

    def test_clean_transaction_verified(self):
        # Gross = ₹10,000, MDR(2%) = ₹200, GST(18%) = ₹36, Expected = ₹9,764
        res, waterfall = self.verifier.verify_reconciliation(
            transaction_id="TXN_VER_1",
            utr="UTR_VER_1",
            gross_amount=10000.0,
            actual_bank_credit=9764.0
        )
        self.assertEqual(res.verification_status, "VERIFIED")
        self.assertEqual(waterfall.variance, 0.0)
        self.assertEqual(waterfall.mdr_amount, 200.0)
        self.assertEqual(waterfall.gst_amount, 36.0)
        self.assertEqual(len(res.checks_failed), 0)

    def test_refund_deduction_verified(self):
        # Gross = ₹10,000, MDR = ₹200, GST = ₹36, Refund = ₹500, TDS = ₹100 -> Expected = ₹9,164
        res, waterfall = self.verifier.verify_reconciliation(
            transaction_id="TXN_VER_2",
            utr="UTR_VER_2",
            gross_amount=10000.0,
            actual_bank_credit=9164.0,
            refund_amount=500.0,
            tds_rate=0.01  # ₹100 TDS
        )
        self.assertEqual(res.verification_status, "VERIFIED")
        self.assertEqual(waterfall.theoretical_net_settlement, 9164.0)
        self.assertEqual(waterfall.actual_bank_credit, 9164.0)
        self.assertEqual(waterfall.variance, 0.0)

    def test_variance_fails_verification(self):
        # Expected = ₹9,764, Bank Credited = ₹9,200 (Variance = ₹564)
        res, waterfall = self.verifier.verify_reconciliation(
            transaction_id="TXN_VER_3",
            utr="UTR_VER_3",
            gross_amount=10000.0,
            actual_bank_credit=9200.0
        )
        self.assertEqual(res.verification_status, "REJECTED")
        self.assertEqual(waterfall.variance, 564.0)
        self.assertGreater(len(res.checks_failed), 0)

    def test_duplicate_utr_rejected(self):
        # First settlement with UTR_DUP_999 passes
        res1, _ = self.verifier.verify_reconciliation(
            transaction_id="TXN_1",
            utr="UTR_DUP_999",
            gross_amount=1000.0,
            actual_bank_credit=976.40
        )
        self.assertEqual(res1.verification_status, "VERIFIED")

        # Second settlement reusing UTR_DUP_999 MUST BE REJECTED
        res2, _ = self.verifier.verify_reconciliation(
            transaction_id="TXN_2",
            utr="UTR_DUP_999",
            gross_amount=1000.0,
            actual_bank_credit=976.40
        )
        self.assertEqual(res2.verification_status, "REJECTED")
        self.assertTrue(any("DUPLICATE_UTR_DETECTED" in c for c in res2.checks_failed))

if __name__ == "__main__":
    unittest.main()

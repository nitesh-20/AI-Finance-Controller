"""
Unit Tests for Multi-Level Deterministic Matching Engine:
Level 1: Exact UTR
Level 2: Amount + Date Tolerance
Level 3: Reference Matching
Level 4: Subset-Sum Matching
"""
import unittest
from decimal import Decimal
from app.models.three_way import RazorpaySettlementItem, BankStatementRecord, MerchantLedgerEntry
from app.services.matching.deterministic_engine import DeterministicMatchingEngine

class TestDeterministicMatchingEngine(unittest.TestCase):
    def setUp(self):
        self.engine = DeterministicMatchingEngine(date_tolerance_days=1, amount_tolerance_paise=0.05)

    def test_level_1_exact_utr_matching(self):
        rzp = RazorpaySettlementItem(
            transaction_id="TXN_101",
            order_id="ORD_101",
            utr="UTR_HDFC_9999",
            gross_amount=1000.0,
            mdr_amount=20.0,
            gst_on_mdr=3.60,
            expected_settlement=976.40,
            settlement_date="2026-03-10 10:00:00",
            payment_method="UPI"
        )
        bank = BankStatementRecord(
            bank_txn_id="BNK_101",
            utr="UTR_HDFC_9999",
            bank_date="2026-03-11 11:00:00",
            credit_amount=976.40,
            narration="CMS/RAZORPAY/UTR_HDFC_9999"
        )
        ledger = MerchantLedgerEntry(
            invoice_id="INV_101",
            order_id="ORD_101",
            customer_name="Aarav Sharma",
            gross_order_value=1000.0,
            created_at="2026-03-10 10:00:00",
            net_receivable=976.40
        )

        matched, unresolved, unmatched_b = self.engine.match_datasets([rzp], [bank], [ledger])
        self.assertEqual(len(matched), 1)
        self.assertEqual(matched[0].match_level, "UTR_EXACT")
        self.assertEqual(matched[0].confidence, "deterministic")
        self.assertEqual(len(unresolved), 0)

    def test_level_2_amount_and_date_matching(self):
        rzp = RazorpaySettlementItem(
            transaction_id="TXN_102",
            order_id="ORD_102",
            utr="UNKNOWN",
            gross_amount=5000.0,
            mdr_amount=100.0,
            gst_on_mdr=18.0,
            expected_settlement=4882.0,
            settlement_date="2026-03-10 12:00:00",
            payment_method="Credit Card"
        )
        bank = BankStatementRecord(
            bank_txn_id="BNK_102",
            utr="BNK_REF_DIFF",
            bank_date="2026-03-11 14:00:00",
            credit_amount=4882.0,
            narration="RAZORPAY_PAYOUT_TRANSFER"
        )

        matched, unresolved, unmatched_b = self.engine.match_datasets([rzp], [bank], [])
        self.assertEqual(len(matched), 1)
        self.assertEqual(matched[0].match_level, "AMOUNT_DATE_TOLERANCE")

    def test_level_4_subset_sum_matching(self):
        # Target Bank Credit: ₹100,000 composed of 5 distinct settlements
        rzp_items = [
            RazorpaySettlementItem(
                transaction_id=f"TXN_SUB_{i}",
                order_id=f"ORD_SUB_{i}",
                utr="POOL_REF",
                gross_amount=amt / 0.9764,
                mdr_amount=20.0,
                gst_on_mdr=3.6,
                expected_settlement=amt,
                settlement_date="2026-03-10 10:00:00",
                payment_method="UPI"
            )
            for i, amt in enumerate([30000.0, 25000.0, 20000.0, 15000.0, 10000.0])
        ]
        bank = BankStatementRecord(
            bank_txn_id="BNK_BULK_1",
            utr="UTR_BULK_AGGREGATED",
            bank_date="2026-03-11 12:00:00",
            credit_amount=100000.0,
            narration="CMS/RAZORPAY/BULK_SETTLEMENT_CREDIT"
        )

        matched, unresolved, unmatched_b = self.engine.match_datasets(rzp_items, [bank], [])
        self.assertEqual(len(matched), 5)
        for m in matched:
            self.assertEqual(m.match_level, "SUBSET_SUM")

if __name__ == "__main__":
    unittest.main()

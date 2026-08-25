"""
Unit & Integration Tests for Deterministic Reconciliation Engine
"""
import unittest
from app.services.reconciliation_engine import reconciliation_engine
from app.services.reconciliation_service import reconciliation_service
from app.models.transaction import FinancialRecordModel
from app.services.transaction_auditor import transaction_auditor

class TestReconciliationEngine(unittest.TestCase):
    def test_clean_match(self):
        """Verify clean match where Gross=10000, MDR=2% (200), GST=18% (36), Net=9764."""
        record = FinancialRecordModel(
            id="REC_TEST_01",
            transactionId="TXN_TEST_MATCH",
            orderId="ORD_TEST_01",
            settlementId="SETTLE_TEST_01",
            timestamp="2026-08-25T10:00:00Z",
            customerName="Enterprise Corp",
            paymentMethod="UPI",
            grossAmount=10000.0,
            expectedGatewayFee=200.0,
            expectedGst=36.0,
            expectedSettlementAmount=9764.0,
            actualSettlementAmount=9764.0,
            actualGatewayFee=200.0,
            actualGst=36.0,
            status="success",
            settlementStatus="settled"
        )
        audit = transaction_auditor.audit_transaction(record)
        self.assertEqual(audit.reconciliation_status, "MATCHED")
        self.assertEqual(audit.variance_amount, 0.0)
        self.assertEqual(audit.waterfall.theoretical_net_settlement, 9764.0)

    def test_missing_settlement_detection(self):
        """Verify detection when actual settlement is 0 despite successful payment."""
        record = FinancialRecordModel(
            id="REC_TEST_02",
            transactionId="TXN_TEST_MISSING",
            orderId="ORD_TEST_02",
            settlementId="",
            timestamp="2026-08-25T10:00:00Z",
            customerName="Customer Alpha",
            paymentMethod="Netbanking",
            grossAmount=18500.0,
            expectedGatewayFee=370.0,
            expectedGst=66.6,
            expectedSettlementAmount=18063.4,
            actualSettlementAmount=0.0,
            actualGatewayFee=0.0,
            actualGst=0.0,
            status="success",
            settlementStatus="discrepancy",
            notes="Missing settlement after SLA"
        )
        audit = transaction_auditor.audit_transaction(record)
        self.assertEqual(audit.reconciliation_status, "DISCREPANCY")
        self.assertEqual(audit.root_cause, "Missing Settlement")
        self.assertEqual(audit.variance_amount, 18063.4)

    def test_reconciliation_service_summary(self):
        """Verify summary calculations produce proper rates and metrics."""
        summary = reconciliation_service.get_summary()
        self.assertIn("total_transactions", summary)
        self.assertIn("matched_count", summary)
        self.assertIn("match_rate", summary)
        self.assertGreaterEqual(summary["match_rate"], 0.0)

if __name__ == "__main__":
    unittest.main()

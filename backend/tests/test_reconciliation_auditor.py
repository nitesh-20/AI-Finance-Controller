import unittest
from app.models.transaction import FinancialRecordModel
from app.services.transaction_auditor import transaction_auditor
from app.services.reconciliation_engine import reconciliation_engine
from app.services.transaction_service import transaction_service

class TestReconciliationAuditor(unittest.TestCase):
    def setUp(self):
        transaction_service.load_records()

    def test_perfect_match(self):
        """Case 1: Perfect match - gross ₹10,000, 2% MDR, 18% GST -> net ₹9,764.00, variance 0.0"""
        record = FinancialRecordModel(
            id="REC-TEST-1",
            transactionId="TXN_TEST_MATCHED",
            orderId="ORD_TEST_1",
            settlementId="SETTLE_TEST_1",
            timestamp="2026-08-21T10:00:00Z",
            customerName="Test User",
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
        
        result = transaction_auditor.audit_transaction(record)
        
        self.assertEqual(result.reconciliation_status, "MATCHED")
        self.assertEqual(result.variance_amount, 0.0)
        self.assertEqual(result.confidence_score, 100)
        self.assertEqual(result.recommended_action, "RECONCILE_CLEAN")
        self.assertEqual(result.waterfall.mdr_amount, 200.0)
        self.assertEqual(result.waterfall.gst_on_mdr, 36.0)
        self.assertEqual(result.waterfall.theoretical_net_settlement, 9764.0)
        self.assertEqual(len(result.audit_steps), 10)

    def test_mdr_tier_discrepancy(self):
        """Case 2: Wrong MDR Tier Applied (International Card charged at 3.5% instead of 2.0%)"""
        record = FinancialRecordModel(
            id="REC-TEST-2",
            transactionId="TXN_98217366",
            orderId="ORD_2026_8826",
            settlementId="SETTLE_2026_0820_01",
            timestamp="2026-08-20T17:10:00Z",
            customerName="David Miller",
            paymentMethod="Credit Card",
            grossAmount=22000.0,
            expectedGatewayFee=440.0,
            expectedGst=79.2,
            expectedSettlementAmount=21480.8,
            actualSettlementAmount=21092.0,
            actualGatewayFee=770.0,
            actualGst=138.6,
            status="success",
            settlementStatus="discrepancy"
        )
        
        result = transaction_auditor.audit_transaction(record)
        
        self.assertEqual(result.reconciliation_status, "DISCREPANCY")
        self.assertAlmostEqual(result.variance_amount, 388.8, places=1)
        self.assertEqual(result.root_cause, "Wrong MDR Tier Applied")
        self.assertEqual(result.confidence_score, 94)
        self.assertEqual(result.waterfall.contracted_mdr_rate, 0.02)
        self.assertEqual(result.waterfall.actual_net_settled, 21092.0)

    def test_gst_rounding_discrepancy(self):
        """Case 3: GST Rounding Error (₹15 GST deducted on a ₹7 MDR fee)"""
        record = FinancialRecordModel(
            id="REC-TEST-3",
            transactionId="TXN_98217359",
            orderId="ORD_2026_8833",
            settlementId="SETTLE_2026_0820_01",
            timestamp="2026-08-20T13:40:00Z",
            customerName="Pooja Patel",
            paymentMethod="UPI",
            grossAmount=350.0,
            expectedGatewayFee=7.0,
            expectedGst=1.26,
            expectedSettlementAmount=341.74,
            actualSettlementAmount=328.0,
            actualGatewayFee=7.0,
            actualGst=15.0,
            status="success",
            settlementStatus="discrepancy"
        )
        
        result = transaction_auditor.audit_transaction(record)
        
        self.assertEqual(result.reconciliation_status, "DISCREPANCY")
        self.assertEqual(result.root_cause, "GST / Rounding Error")
        self.assertEqual(result.recommended_action, "JOURNAL_ADJUSTMENT")

    def test_duplicate_charge_detection(self):
        """Case 4: Duplicate Transaction (Order billed twice)"""
        record = FinancialRecordModel(
            id="REC-TEST-4",
            transactionId="TXN_98217349_DUP",
            orderId="ORD_2026_8843",
            settlementId="SETTLE_2026_0821_01",
            timestamp="2026-08-21T09:46:00Z",
            customerName="Priya Nair",
            paymentMethod="UPI",
            grossAmount=1200.0,
            expectedGatewayFee=24.0,
            expectedGst=4.32,
            expectedSettlementAmount=1171.68,
            actualSettlementAmount=1171.68,
            actualGatewayFee=24.0,
            actualGst=4.32,
            status="success",
            settlementStatus="discrepancy"
        )
        
        result = transaction_auditor.audit_transaction(record)
        
        self.assertEqual(result.reconciliation_status, "DISCREPANCY")
        self.assertEqual(result.root_cause, "Duplicate Transaction")
        self.assertEqual(result.recommended_action, "REFUND_DUPLICATE")
        self.assertEqual(result.variance_amount, 1200.0)

    def test_missing_settlement_audit(self):
        """Case 5: Missing Settlement (Captured payment, no bank credit after SLA)"""
        record = FinancialRecordModel(
            id="REC-TEST-5",
            transactionId="TXN_98217350",
            orderId="ORD_2026_8842",
            settlementId="",
            timestamp="2026-08-21T09:30:00Z",
            customerName="Sneha Roy",
            paymentMethod="Netbanking",
            grossAmount=18500.0,
            expectedGatewayFee=370.0,
            expectedGst=66.6,
            expectedSettlementAmount=18063.4,
            actualSettlementAmount=0.0,
            actualGatewayFee=0.0,
            actualGst=0.0,
            status="success",
            settlementStatus="unsettled",
            notes="Missing settlement after SLA"
        )
        
        result = transaction_auditor.audit_transaction(record)
        
        self.assertEqual(result.reconciliation_status, "DISCREPANCY")
        self.assertEqual(result.root_cause, "Missing Settlement")
        self.assertEqual(result.recommended_action, "DISPUTE_RAZORPAY")
        self.assertEqual(result.variance_amount, 18063.4)

if __name__ == "__main__":
    unittest.main()

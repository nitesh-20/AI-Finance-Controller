import unittest
from app.services.transaction_auditor import TransactionAuditorService
from app.models.transaction import FinancialRecordModel
from app.models.auditor import RootCauseClassification, RecommendedAction

class TestAuditorEdgeCases(unittest.TestCase):
    def test_gst_fractional_rounding_detection(self):
        auditor = TransactionAuditorService(standard_contracted_mdr=0.02, standard_gst_rate=0.18)
        
        # Gross: 1000. MDR: 20. GST: 3.60 -> Expected Net: 976.40
        # Actual settled: 975.80 -> Difference 0.60 (within GST rounding tolerance of 1.50)
        record = FinancialRecordModel(
            id="REC_GST_001",
            transactionId="TXN_GST_ROUND_01",
            orderId="ORD_GST_01",
            settlementId="SETTLE_2026_0820_01",
            timestamp="2026-08-20T10:00:00Z",
            customerName="Ananya Sharma",
            paymentMethod="Credit Card",
            grossAmount=1000.0,
            expectedGatewayFee=20.0,
            expectedGst=3.60,
            expectedSettlementAmount=976.40,
            actualSettlementAmount=975.80,
            actualGatewayFee=20.0,
            actualGst=4.20,
            status="success",
            settlementStatus="settled"
        )
        
        result = auditor.audit_transaction(record)
        self.assertEqual(result.root_cause, RootCauseClassification.GST_ROUNDING_ERROR.value)
        self.assertEqual(result.recommended_action, RecommendedAction.JOURNAL_ADJUSTMENT.value)
        self.assertAlmostEqual(result.variance_amount, 0.60, places=2)

    def test_zero_amount_transaction_handling(self):
        auditor = TransactionAuditorService()
        record = FinancialRecordModel(
            id="REC_ZERO_001",
            transactionId="TXN_ZERO_01",
            orderId="ORD_ZERO_01",
            settlementId="SETTLE_2026_0820_01",
            timestamp="2026-08-20T10:00:00Z",
            customerName="Test User",
            paymentMethod="UPI",
            grossAmount=0.0,
            expectedGatewayFee=0.0,
            expectedGst=0.0,
            expectedSettlementAmount=0.0,
            actualSettlementAmount=0.0,
            status="success",
            settlementStatus="settled"
        )
        
        result = auditor.audit_transaction(record)
        self.assertEqual(result.root_cause, RootCauseClassification.MATCHED.value)
        self.assertAlmostEqual(result.variance_amount, 0.0, places=2)

    def test_tds_section_194o_withholding_calculation(self):
        auditor = TransactionAuditorService(standard_contracted_mdr=0.02, standard_gst_rate=0.18)
        
        # Gross: 50,000. MDR (2%): 1,000. GST (18% on MDR): 180. TDS (1% on Gross): 500.
        # Theoretical Net: 50,000 - 1,000 - 180 - 500 = 48,320.00
        record = FinancialRecordModel(
            id="REC_TDS_001",
            transactionId="TXN_TDS_01",
            orderId="ORD_TDS_01",
            settlementId="SETTLE_2026_0820_01",
            timestamp="2026-08-20T10:00:00Z",
            customerName="Apex Enterprises",
            paymentMethod="NetBanking",
            grossAmount=50000.0,
            expectedGatewayFee=1000.0,
            expectedGst=180.0,
            expectedSettlementAmount=48320.0,
            actualSettlementAmount=48320.0,
            status="success",
            settlementStatus="settled"
        )
        
        result = auditor.audit_transaction(record, tds_rate=0.01)
        self.assertAlmostEqual(result.waterfall.theoretical_net_settlement, 48320.0, places=2)
        self.assertAlmostEqual(result.variance_amount, 0.0, places=2)
        self.assertEqual(result.root_cause, RootCauseClassification.MATCHED.value)

if __name__ == "__main__":
    unittest.main()

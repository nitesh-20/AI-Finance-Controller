from backend.app.models.transaction import FinancialRecordModel
from backend.app.services.transaction_auditor import transaction_auditor
from backend.app.services.reconciliation_engine import reconciliation_engine
from backend.app.services.transaction_service import transaction_service

def setup_function():
    transaction_service.load_records()

def test_perfect_match():
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
    
    assert result.reconciliation_status == "MATCHED"
    assert result.variance_amount == 0.0
    assert result.root_cause == "MATCHED"
    assert result.confidence_score == 100
    assert result.recommended_action == "RECONCILE_CLEAN"
    assert result.waterfall.mdr_amount == 200.0
    assert result.waterfall.gst_on_mdr == 36.0
    assert result.waterfall.theoretical_net_settlement == 9764.0
    assert len(result.audit_steps) == 10

def test_mdr_tier_discrepancy():
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
    
    assert result.reconciliation_status == "DISCREPANCY"
    assert result.variance_amount == 388.80
    assert result.root_cause == "Wrong MDR Tier Applied"
    assert result.confidence_score >= 90
    assert result.recommended_action in ["JOURNAL_ADJUSTMENT", "DISPUTE_RAZORPAY"]

def test_unmapped_chargeback_reserve():
    """Case 3: Unmapped Chargeback Reserve (₹400 variance)"""
    record = FinancialRecordModel(
        id="REC-TEST-3",
        transactionId="TXN_98217345",
        orderId="ORD_2026_8806",
        settlementId="SETTLE_2026_0819_01",
        timestamp="2026-08-19T12:20:30Z",
        customerName="Rajesh Nair",
        paymentMethod="Credit Card",
        grossAmount=12450.0,
        expectedGatewayFee=249.0,
        expectedGst=44.82,
        expectedSettlementAmount=12156.18,
        actualSettlementAmount=11756.18,
        actualGatewayFee=649.0,
        actualGst=44.82,
        status="success",
        settlementStatus="discrepancy",
        notes="Gateway deducted ₹400 chargeback fee variance"
    )
    
    result = transaction_auditor.audit_transaction(record)
    
    assert result.reconciliation_status == "DISCREPANCY"
    assert result.variance_amount == 400.0
    assert result.root_cause == "Unmapped Chargeback Reserve"
    assert result.recommended_action == "DISPUTE_RAZORPAY"
    assert result.confidence_score >= 95

def test_missing_settlement():
    """Case 4: Payment captured but settlement payout omitted"""
    record = FinancialRecordModel(
        id="REC-TEST-4",
        transactionId="TXN_98217350",
        orderId="ORD_2026_8811",
        settlementId=None,
        timestamp="2026-08-19T17:30:15Z",
        customerName="Manoj Tiwari",
        paymentMethod="NetBanking",
        grossAmount=18500.0,
        expectedGatewayFee=370.0,
        expectedGst=66.6,
        expectedSettlementAmount=18063.4,
        actualSettlementAmount=0.0,
        status="success",
        settlementStatus="pending",
        notes="Captured by merchant, missing in Razorpay bank payout batch"
    )
    
    result = transaction_auditor.audit_transaction(record)
    
    assert result.reconciliation_status == "DISCREPANCY"
    assert result.variance_amount == 18063.40
    assert result.root_cause == "Missing Settlement"
    assert result.recommended_action == "DISPUTE_RAZORPAY"

def test_duplicate_transaction():
    """Case 5: Duplicate customer capture detected"""
    record = FinancialRecordModel(
        id="REC-TEST-5",
        transactionId="TXN_98217355_DUP",
        orderId="ORD_2026_8815",
        settlementId="SETTLE_2026_0819_01",
        timestamp="2026-08-19T21:40:08Z",
        customerName="Neha Deshmukh",
        paymentMethod="UPI",
        grossAmount=2450.0,
        expectedGatewayFee=49.0,
        expectedGst=8.82,
        expectedSettlementAmount=2392.18,
        actualSettlementAmount=2392.18,
        status="success",
        settlementStatus="settled",
        notes="Duplicate capture detected for order ORD_2026_8815 within 8 seconds"
    )
    
    result = transaction_auditor.audit_transaction(record)
    
    assert result.reconciliation_status == "DISCREPANCY"
    assert result.root_cause == "Duplicate Transaction"
    assert result.recommended_action == "REFUND_DUPLICATE"
    assert result.confidence_score >= 98

def test_gst_rounding_difference():
    """Case 6: Small fractional rounding difference (e.g. ₹0.30)"""
    record = FinancialRecordModel(
        id="REC-TEST-6",
        transactionId="TXN_ROUNDING_1",
        orderId="ORD_ROUND_1",
        settlementId="SETTLE_2026_0819_01",
        timestamp="2026-08-19T10:00:00Z",
        customerName="Rounding User",
        paymentMethod="Debit Card",
        grossAmount=3333.33,
        expectedGatewayFee=66.67,
        expectedGst=12.00,
        expectedSettlementAmount=3254.66,
        actualSettlementAmount=3254.46,  # 20 paise variance
        status="success",
        settlementStatus="settled"
    )
    
    result = transaction_auditor.audit_transaction(record)
    
    assert result.reconciliation_status == "DISCREPANCY"
    assert result.variance_amount == 0.20
    assert result.root_cause == "GST / Rounding Error"
    assert result.recommended_action == "JOURNAL_ADJUSTMENT"

def test_edge_cases_zero_and_large_volume():
    """Case 7: Zero-value and High-value volume precision tests"""
    # Zero value
    rec_zero = FinancialRecordModel(
        id="REC-ZERO",
        transactionId="TXN_ZERO",
        orderId="ORD_ZERO",
        settlementId="SETTLE_ZERO",
        timestamp="2026-08-21T10:00:00Z",
        customerName="Zero",
        paymentMethod="UPI",
        grossAmount=0.0,
        expectedGatewayFee=0.0,
        expectedGst=0.0,
        expectedSettlementAmount=0.0,
        actualSettlementAmount=0.0,
        status="success",
        settlementStatus="settled"
    )
    res_zero = transaction_auditor.audit_transaction(rec_zero)
    assert res_zero.waterfall.gross_amount == 0.0
    assert res_zero.waterfall.variance == 0.0

    # High value ₹10,00,000 (10 Lakhs)
    rec_large = FinancialRecordModel(
        id="REC-LARGE",
        transactionId="TXN_LARGE",
        orderId="ORD_LARGE",
        settlementId="SETTLE_LARGE",
        timestamp="2026-08-21T10:00:00Z",
        customerName="Corporate Buyer",
        paymentMethod="NetBanking",
        grossAmount=1000000.0,
        expectedGatewayFee=20000.0,
        expectedGst=3600.0,
        expectedSettlementAmount=976400.0,
        actualSettlementAmount=976400.0,
        actualGatewayFee=20000.0,
        actualGst=3600.0,
        status="success",
        settlementStatus="settled"
    )
    res_large = transaction_auditor.audit_transaction(rec_large)
    assert res_large.waterfall.mdr_amount == 20000.0
    assert res_large.waterfall.gst_on_mdr == 3600.0
    assert res_large.waterfall.theoretical_net_settlement == 976400.0
    assert res_large.reconciliation_status == "MATCHED"

def test_batch_reconciliation_integrity():
    """Case 8: Test batch integrity across full dataset"""
    from backend.app.services.transaction_service import transaction_service
    records = transaction_service.get_all_records()
    assert len(records) >= 50
    
    recon_result = reconciliation_engine.reconcile_batch(records)
    assert recon_result.metrics.total_records_processed == len(records)
    assert recon_result.metrics.matched_count == 37
    assert recon_result.metrics.exceptions_count == 5
    assert recon_result.metrics.match_rate_percentage == 71.2

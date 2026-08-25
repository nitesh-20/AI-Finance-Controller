"""
Three-Way Reconciliation Data Models:
1. Razorpay Settlement Record
2. Bank Statement Credit Record
3. Merchant Ledger / Invoice Record
"""
from typing import Optional, List
from pydantic import BaseModel, Field
from decimal import Decimal

class RazorpaySettlementItem(BaseModel):
    transaction_id: str
    order_id: str
    utr: str
    gross_amount: float
    mdr_amount: float
    gst_on_mdr: float
    tds_amount: float = 0.0
    refund_amount: float = 0.0
    chargeback_amount: float = 0.0
    other_deductions: float = 0.0
    expected_settlement: float
    settlement_date: str
    payment_method: str
    status: str = "settled"

class BankStatementRecord(BaseModel):
    bank_txn_id: str
    utr: str
    bank_date: str
    credit_amount: float
    narration: str
    bank_name: str = "HDFC Bank Ltd"
    account_number: str = "XXXX-XXXX-8921"
    matched_status: str = "UNMATCHED"

class MerchantLedgerEntry(BaseModel):
    invoice_id: str
    order_id: str
    customer_name: str
    gross_order_value: float
    created_at: str
    merchant_id: str = "MID_RAZORPAY_8839"
    tax_amount: float = 0.0
    net_receivable: float
    status: str = "INVOICED"

# Financial Data Models & Schemas
**Razorpay AI Buildathon — Track 04: AI Finance Controller ("Run the books and the cash position")**

---

## 1. Multi-Source Ingestion Schemas

### Source A: Gateway Settlements (`RazorpaySettlementItem`)
Represents transactions captured by the payment gateway and processed for payout:

```typescript
interface RazorpaySettlementItem {
  transaction_id: string;         // e.g. "TXN_RZP_100042"
  order_id: string;               // e.g. "ORD_INV_200042"
  utr: string;                    // e.g. "UTR_HDFC_800042" or "UNKNOWN"
  gross_amount: number;           // Captured transaction value (INR)
  mdr_amount: number;             // Contracted MDR fee (2.00%)
  gst_on_mdr: number;             // 18.00% GST on MDR
  tds_amount: number;             // Section 194-O withholding (if applicable)
  refund_amount: number;          // Deducted refund (if cancelled)
  chargeback_amount: number;      // Gateway reserve holdback
  other_deductions: number;       // Bank transfer/network fees
  expected_settlement: number;    // Authoritative theoretical payout
  settlement_date: string;        // Payout batch timestamp
  payment_method: string;         // UPI, Credit Card, Debit Card, NetBanking
  status: string;                 // "settled" | "pending"
}
```

---

### Source B: Bank Statements (`BankStatementRecord`)
Represents statutory bank ledger credits received into merchant current accounts:

```typescript
interface BankStatementRecord {
  bank_txn_id: string;            // e.g. "BNK_TXN_400042"
  utr: string;                    // Bank Unique Transaction Reference
  bank_date: string;              // Value date of credit
  credit_amount: number;          // Net funds credited into account
  narration: string;              // Raw bank statement narration (e.g. "CMS/RAZORPAY/...")
  bank_name: string;              // "HDFC Bank Ltd", "ICICI Bank Ltd", etc.
  account_number: string;         // Masked account identifier (e.g. "XXXX-XXXX-8921")
  matched_status: string;         // "MATCHED" | "UNMATCHED"
}
```

---

### Source C: Merchant Ledger / Invoices (`MerchantLedgerEntry`)
Represents merchant internal ERP order records and customer billing entries:

```typescript
interface MerchantLedgerEntry {
  invoice_id: string;             // e.g. "INV_2026_300042"
  order_id: string;               // ERP cart / order identifier
  customer_name: string;          // Customer billing name
  gross_order_value: number;      // Invoiced gross amount
  created_at: string;             // Invoice generation timestamp
  merchant_id: string;            // Merchant identification code
  tax_amount: number;             // Invoiced GST amount
  net_receivable: number;         // Expected customer receivable
  status: string;                 // "INVOICED" | "PAID" | "CANCELLED"
}
```

---

## 2. Core Reconciliation & Audit Entities

### The 10-Step Audit Waterfall (`AuditWaterfallModel`)
Deterministic breakdown calculated with Python `Decimal`:

```json
{
  "gross_amount": 20000.00,
  "contracted_mdr_rate": 0.02,
  "mdr_amount": 400.00,
  "gst_rate": 0.18,
  "gst_amount": 72.00,
  "tds_rate": 0.0,
  "tds_amount": 0.00,
  "refund_amount": 0.00,
  "chargeback_amount": 0.00,
  "other_deductions": 0.00,
  "theoretical_net_settlement": 19528.00,
  "actual_bank_credit": 19128.00,
  "variance": 400.00
}
```

---

### Verification Gate Result (`VerificationResultModel`)
Machine-readable outcome emitted by the `FinancialVerificationGate`:

```json
{
  "verification_status": "REJECTED",
  "expected_amount": 19528.00,
  "actual_amount": 19128.00,
  "variance": 400.00,
  "checks_passed": [
    "UNIQUE_UTR_VERIFIED: No duplicate settlement references detected",
    "STATUTORY_TAX_VERIFIED: 18% GST matches MDR base precisely"
  ],
  "checks_failed": [
    "VARIANCE_DETECTED: Theoretical Net ₹19,528.00 differs from Bank Credit ₹19,128.00 (Discrepancy: ₹400.00)"
  ],
  "verified_at": "2026-09-04T11:45:00.000Z"
}
```

---

### Ground Truth Entity (`ground_truth.csv`)
Used by `scripts/evaluate_controller.py` to evaluate precision and recall:

```csv
transaction_id,order_id,utr,ground_truth_status,ground_truth_match_id,ground_truth_exception_type,ground_truth_expected_amount,ground_truth_actual_credit,ground_truth_variance,ground_truth_root_cause
TXN_RZP_100000,ORD_INV_200000,UTR_HDFC_800000,MATCHED,UTR_HDFC_800000,NONE,976.40,976.40,0.00,MATCHED
TXN_RZP_100003,ORD_INV_200003,UTR_HDFC_800001,EXCEPTION,UNRESOLVED,DUPLICATE_UTR,14250.00,14250.00,0.00,Duplicate UTR Reference Detected
TXN_RZP_100008,ORD_INV_200008,UNKNOWN,EXCEPTION,UNRESOLVED,MISSING_SETTLEMENT,18063.40,0.00,18063.40,Gateway Settlement Omitted from Bank Statement
```

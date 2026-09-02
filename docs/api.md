# REST & Voice API Documentation

The AI Finance Controller exposes high-performance REST endpoints under the `/api` prefix.

## Base URL
```
http://localhost:8000/api
```

---

## 1. Reconciliation & Audit

### `GET /api/reconciliation/records`
Returns ingested 3-way reconciliation transaction records with match classifications.

**Query Parameters:**
* `status` (optional): Filter by `MATCHED`, `EXCEPTION`, `AI_PROPOSED`
* `search` (optional): Search query string against transaction ID, order ID, or UTR

**Response (200 OK):**
```json
[
  {
    "transaction_id": "TXN_98217345",
    "utr": "HDFC262319081234",
    "order_id": "ORD_2026_1005",
    "customer_name": "Rajesh Nair",
    "gross_amount": 12500.0,
    "mdr": 250.0,
    "gst_on_mdr": 45.0,
    "expected_settlement": 12205.0,
    "actual_bank_credit": 11805.0,
    "variance": -400.0,
    "current_status": "EXCEPTION",
    "match_method": "DETERMINISTIC_RULES",
    "root_cause": "Unmapped Chargeback Reserve",
    "recommended_action": "DISPUTE_RAZORPAY"
  }
]
```

### `POST /api/reconciliation/run`
Triggers real-time batch reconciliation execution across all records.

**Response (200 OK):**
```json
{
  "total_records": 500,
  "matched_count": 443,
  "exception_count": 57,
  "auto_match_precision": 100.0,
  "wrong_auto_posts": 0,
  "timestamp": "2026-09-02T06:30:00Z"
}
```

### `GET /api/reconciliation/audit/{txn_id}`
Returns the granular 10-step mathematical audit proof and fee waterfall.

---

## 2. Settlement Intelligence

### `GET /api/settlements/overview`
Aggregated monetary metrics across payout batches.

**Response (200 OK):**
```json
{
  "totalGrossSettled": 237470.0,
  "totalNetReceived": 230604.31,
  "totalFeesDeducted": 5479.4,
  "totalGstDeducted": 986.29,
  "totalDiscrepancyAmount": 788.8,
  "pendingSettlementAmount": 57431.85,
  "batches": []
}
```

### `GET /api/settlements/batches`
Itemized list of gateway payout batches with UTR numbers.

**Query Parameters:**
* `status` (optional): `settled`, `discrepancy`, `pending`
* `search` (optional): UTR number or Batch ID

---

## 3. Cash Runway & Liquidity

### `GET /api/cash/position`
Returns real-time merchant liquidity status.

### `GET /api/cash/forecast`
Returns forward rolling daily cash runway projections.

**Query Parameters:**
* `days` (optional, default: 7, max: 14): Forecast horizon

---

## 4. Exceptions & Operations Queue

### `GET /api/exceptions`
Returns all isolated variance items with root-cause classifications.

### `POST /api/exceptions/bulk-status`
Batch update resolution status across multiple exceptions.

**Request Body:**
```json
{
  "exception_ids": ["EXC_1001", "EXC_1002"],
  "status": "RESOLVED",
  "notes": "Reconciled via Razorpay Batch Credit ARN892019"
}
```

---

## 5. Vaani AI Copilot

### `POST /api/agent/chat`
Autonomous tool-calling finance agent endpoint.

**Request Body:**
```json
{
  "query": "Why was TXN_98217345 flagged?"
}
```

**Response (200 OK):**
```json
{
  "response": "Audit Waterfall for TXN_98217345...",
  "intent": "transaction_audit_inquiry",
  "tools_used": ["audit_transaction"],
  "traces": [
    {
      "tool_name": "audit_transaction",
      "tool_output_summary": "Diagnosed Unmapped Chargeback Reserve with variance ₹400.00"
    }
  ],
  "suggested_actions": ["Execute DISPUTE_RAZORPAY", "Show 10-step audit trail"]
}
```

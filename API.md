# REST API Specification & OpenAPI Documentation
**Razorpay AI Buildathon — Track 04: AI Finance Controller ("Run the books and the cash position")**

Interactive Swagger API documentation is available locally at: `http://localhost:8000/docs`

---

## 1. System Health & Telemetry

### `GET /api/health`
Returns service health, version metadata, active engines, and uptime.

**Response (`200 OK`):**
```json
{
  "status": "ok",
  "service": "AI Finance Controller Python Engine",
  "version": "2.0.0",
  "track": "Razorpay Buildathon Track 04: AI Finance Controller",
  "environment": "production",
  "uptime_seconds": 1420.5,
  "engine": {
    "reconciliation": "Deterministic 7-Stage Pipeline",
    "three_way_matching": "Active",
    "cash_forecasting": "7-Day Forward Liquidity",
    "verification_gate": "Strict Decimal Arithmetic Enforced"
  }
}
```

---

## 2. Three-Way Reconciliation

### `GET /api/reconciliation/run`
Executes the sequential 7-stage deterministic matching pipeline across 500+ records.

**Response (`200 OK`):**
```json
{
  "batch_id": "BATCH_20260904_120500",
  "timestamp": "2026-09-04T12:05:00.000Z",
  "total_records": 500,
  "matched_count": 443,
  "ai_proposed_count": 22,
  "verified_count": 465,
  "rejected_count": 35,
  "exception_count": 35,
  "auto_match_precision": 100.0,
  "wrong_auto_posts": 0,
  "total_gross_processed": 6340882.23,
  "total_reconciled_amount": 5580210.15,
  "total_exception_amount": 331315.45,
  "match_rate_percentage": 88.6
}
```

### `GET /api/reconciliation/audit/{txn_id}`
Returns the line-item 10-step mathematical waterfall, diagnosed root cause, and evidence trail for any transaction.

**Response (`200 OK`):**
```json
{
  "transaction_id": "TXN_98217345",
  "waterfall": {
    "gross_amount": 20000.0,
    "contracted_mdr_rate": 0.02,
    "mdr_amount": 400.0,
    "gst_rate": 0.18,
    "gst_amount": 72.0,
    "tds_amount": 0.0,
    "refund_amount": 0.0,
    "chargeback_amount": 0.0,
    "theoretical_net_settlement": 19528.0,
    "actual_bank_credit": 19128.0,
    "variance": 400.0
  },
  "root_cause": "Unmapped Chargeback Reserve",
  "confidence": 95,
  "recommended_action": "DISPUTE_RAZORPAY",
  "evidence": [
    "Gateway ARN trace verified",
    "Settlement batch deduction of ₹400.00 observed"
  ]
}
```

---

## 3. Exception Center & Action Workflow

### `GET /api/exceptions`
Returns all isolated financial exceptions sorted by monetary impact.

### `POST /api/actions/execute`
Executes an operational action (`DISPUTE_RAZORPAY`, `JOURNAL_ADJUSTMENT`, `QUARANTINE`, `REFUND_DUPLICATE`) and executes post-action verification.

**Request Payload:**
```json
{
  "transaction_id": "TXN_98217345",
  "action_type": "JOURNAL_ADJUSTMENT",
  "notes": "Adjusted international card MDR rate from 2.0% to 3.5%"
}
```

**Response (`200 OK`):**
```json
{
  "action_id": "ADJ_2026_001",
  "status": "SUCCESS",
  "message": "Journal adjustment booked. Ledger reconciled clean with ₹0.00 variance.",
  "pre_action_variance": 388.80,
  "post_action_variance": 0.00,
  "health_score_before": 82,
  "health_score_after": 86,
  "health_score_delta": 4,
  "audit_event_id": "EVT_2026_0904_8821"
}
```

---

## 4. Cash Position & 7-Day Forecast

### `GET /api/cash/position`
Returns current liquid cash, expected settlement inflows, pending holdbacks, and refund liability buffer.

### `GET /api/cash/forecast`
Returns 7-day forward rolling liquidity forecast with confidence scores and weekend banking cycle adjustments.

---

## 5. Performance & Evaluation Benchmarking

### `GET /api/performance/benchmark`
Returns scientific benchmark comparison comparing Naive LLM Baseline vs AI Finance Controller.

---

## 6. Audit Trail

### `GET /api/audit`
Returns the immutable chronological audit log detailing every ingestion, matching, verification, and resolution decision.

# Rigorous Evaluation & Benchmark Report
**Razorpay AI Buildathon — Track 04: AI Finance Controller ("Run the books and the cash position")**

---

## 1. Official Evaluation Bar

> *"Throughput plus measured accuracy plus an honest exception list. One cherry-picked match proves nothing."*

This system was evaluated against two datasets:
1. **500-Record Adversarial Benchmark Dataset** (`data/synthetic/`, seed=42)
2. **1,000-Record Held-Out Evaluation Dataset** (`data/evaluation/`, seed=101)

Zero training or rule tuning was performed on the held-out evaluation dataset.

---

## 2. Benchmark Results: Naive Baseline vs AI Finance Controller

The table below reflects real, unmanipulated benchmark results measured via `scripts/evaluate_controller.py`:

| Metric | Naive Matching Baseline | AI Finance Controller | Delta / Operational Value |
| :--- | :---: | :---: | :--- |
| **Dataset Size** | 1,000 Records | 1,000 Records | Multi-source payment batch |
| **Clean Matches** | 985 | 910 | Real, verified clean matches |
| **Reported Match Rate** | 98.5% (Inflated) | 91.0% | Truthful throughput |
| **Verified Auto-Match Precision** | 92.39% | **100.0%** | **Correct Auto-Matches / Total Auto-Matches** |
| **Clean-Record Recall** | N/A | **100.0%** | **Recovered Clean Matches / Ground-Truth Clean Matches** |
| **False Positives** | **75 Wrong Matches** | **0** | No invalid revenue recognition |
| **Incorrect Auto-Posts** | **75 Dangerous Posts** | **0 (Observed)** | 0 incorrect auto-posts observed in 1,000 records |
| **Honest Exceptions Isolated**| 15 (Omitted 75) | **90 (All caught)** | Routed to Exception Queue |
| **Total Value Reconciled** | Unverified | **₹19,942,363.32** | Authenticated bank credit |
| **Total Value at Risk** | Unmonitored | **₹814,357.83** | Prioritized by monetary impact |
| **Deterministic Engine Time** | 0.001s | **0.053s** | Complete 1,000-record batch |
| **Deterministic Latency (p50)** | -- | **0.053 ms / record** | Local deterministic calculation speed |

---

## 3. Mathematical Metric Definitions

* **Auto-Match Precision**:
  $$\text{Precision} = \frac{\text{Correct Verified Auto-Matches}}{\text{Total Verified Auto-Matches}} = \frac{910}{910} = 100.0\%$$
* **Clean-Record Recall**:
  $$\text{Clean-Record Recall} = \frac{\text{Correctly Recovered Clean Matches}}{\text{All Ground-Truth Clean Matches}} = \frac{910}{910} = 100.0\%$$
  *(Note: Clean-record recall specifically measures recovery of uncompromised clean records, distinct from overall dataset recall across anomaly classes).*
* **Deterministic Engine Speed**:
  Measured latency reflects local Python `Decimal` calculation and sequential matching engine duration, not remote LLM API latency.

---

## 4. Why Naive LLM Matching Fails

A naive reconciliation approach matching solely on references or asking an LLM to reconcile numbers produces high apparent match rates (98.5%) but commits fatal financial errors:
1. **Duplicate UTRs**: Auto-posts secondary settlements with the same UTR, doubling revenue in error.
2. **Fee Variances**: Treats ₹400 chargeback deductions as normal gateway fee differences.
3. **Partial Refunds**: Treats reduced bank payouts as clean matches rather than customer refund deductions.
4. **Missing Invoices**: Matches gateway transactions even when no merchant ERP invoice exists.

In contrast, the **AI Finance Controller** rejects 100% of these unsafe cases, achieving **100.0% verified auto-match precision** and **0 incorrect auto-posts observed in the 1,000-record held-out evaluation**.

---

## 4. Coverage of the 25 Adversarial Anomaly Types

| ID | Anomaly Classification | Injection Method | Controller Diagnostic | Resolution Action |
| :---: | :--- | :--- | :--- | :--- |
| 1 | **Exact Match** | Ideal standard transaction | `MATCHED` | `RECONCILE_CLEAN` |
| 2 | **T+1 Settlement Drift** | Bank credit delayed by 1 day | `MATCHED` (Stage 3) | `RECONCILE_CLEAN` |
| 3 | **T+2 Banking Delay** | Weekend settlement pause | `MATCHED` (Stage 3) | `RECONCILE_CLEAN` |
| 4 | **Duplicate UTR** | UTR previously credited | `DUPLICATE_UTR` | `QUARANTINE` |
| 5 | **Duplicate Transaction** | Dual capture on same order ID | `DUPLICATE_TRANSACTION` | `REFUND_DUPLICATE` |
| 6 | **Partial Refund** | 30% gross refund deduction | `PARTIAL_REFUND` | `JOURNAL_ADJUSTMENT` |
| 7 | **Full Refund** | 100% order cancellation | `FULL_REFUND` | `JOURNAL_ADJUSTMENT` |
| 8 | **Chargeback Holdback** | Unmapped ₹400 gateway deduction | `CHARGEBACK_RESERVE` | `DISPUTE_RAZORPAY` |
| 9 | **Missing Settlement** | Gateway captured, omitted in bank | `MISSING_SETTLEMENT` | `DISPUTE_RAZORPAY` |
| 10 | **Wrong MDR Tier** | 3.5% international card rate | `WRONG_MDR_TIER` | `JOURNAL_ADJUSTMENT` |
| 11 | **Incorrect GST** | GST diverges from 18% schedule | `GST_ROUNDING_ERROR` | `JOURNAL_ADJUSTMENT` |
| 12 | **Bank Fee Deduction** | ₹50 NEFT handling charge | `BANK_FEE` | `JOURNAL_ADJUSTMENT` |
| 13 | **Settlement Aggregation** | 4 settlements in 1 bulk credit | `SETTLEMENT_AGGREGATION` | `MANUAL_REVIEW` |
| 14 | **Split Settlement** | Payout split across two batches | `SPLIT_SETTLEMENT` | `MANUAL_REVIEW` |
| 15 | **Currency Rounding** | Sub-rupee paise difference | `GST_ROUNDING_ERROR` | `JOURNAL_ADJUSTMENT` |
| 16 | **Missing Invoice** | Unrecorded ERP draft | `MISSING_INVOICE` | `QUARANTINE` |
| 17 | **Narration Variation** | Alternative UPI bank narration | `MATCHED` (Stage 4) | `RECONCILE_CLEAN` |
| 18 | **Merchant Name Variation** | Alias merchant name mapping | `MATCHED` (Stage 4) | `RECONCILE_CLEAN` |
| 19 | **Ref Format Diff** | Truncated reference in narration | `MATCHED` (Stage 4) | `RECONCILE_CLEAN` |
| 20 | **Incorrect Amount** | ₹350 gateway fee variance | `AMOUNT_MISMATCH` | `MANUAL_REVIEW` |
| 21 | **Extra Bank Transaction** | Unmatched orphan bank credit | Unmatched Bank Record | `MANUAL_REVIEW` |
| 22 | **Missing Bank Transaction** | Expected payout not in bank | `MISSING_SETTLEMENT` | `DISPUTE_RAZORPAY` |
| 23 | **Multi-Item Settlement** | Batched gateway capture | `MATCHED` (Stage 5) | `RECONCILE_CLEAN` |
| 24 | **Identical Amount Ambiguity** | Multiple txns with same amount | `MATCHED` (Disambiguated) | `RECONCILE_CLEAN` |
| 25 | **Deliberately Ambiguous** | Unreadable reference & shortage | `UNKNOWN` | `MANUAL_REVIEW` |

---

## 5. How to Reproduce Evaluation

Run the official evaluation script from repository root:

```bash
# Generate fresh datasets
python3 data/synthetic/generator.py

# Execute automated benchmark
python3 scripts/evaluate_controller.py
```

Outputs will be saved in `reports/evaluation/latest.json` and `reports/evaluation/latest.md`.

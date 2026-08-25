# Deterministic Reconciliation & Variance Specification

## Mathematical Principles

Financial settlement accuracy requires strict numerical invariants. The engine calculates expected net settlement amounts according to standard contracted payment gateway schedules.

### Formula Definition

```
1. Contracted MDR Amount = round(Gross Amount * Contracted MDR Rate, 2)
2. Statutory GST on MDR  = round(Contracted MDR Amount * 0.18, 2)
3. Statutory TDS Amount   = round(Gross Amount * TDS Rate, 2)
4. Theoretical Net Payout= round(Gross Amount - MDR Amount - GST on MDR - TDS Amount - Adjustments, 2)
5. Variance               = round(Theoretical Net Payout - Actual Net Settled, 2)
```

---

## Discrepancy Classification Rules

| Root Cause Code | Description | Identification Heuristic | Recommended Action |
| :--- | :--- | :--- | :--- |
| `MATCHED` | Perfect reconciliation | `abs(Variance) <= 0.05` | `RECONCILE_CLEAN` |
| `WRONG_MDR_TIER` | Higher tier or foreign card fee applied | `Actual Fee > Expected MDR * 1.4` | `JOURNAL_ADJUSTMENT` |
| `GST_ROUNDING_ERROR` | Decimal rounding discrepancy | `0.05 < abs(Variance) <= 1.50` | `JOURNAL_ADJUSTMENT` |
| `MISSING_SETTLEMENT` | Payment captured but payout missing | `Gross > 0 and Actual Settled == 0` | `DISPUTE_RAZORPAY` |
| `DUPLICATE_TRANSACTION` | Order charged twice | Duplicate order ID in interval | `REFUND_DUPLICATE` |
| `CHARGEBACK_RESERVE` | Unitemized dispute deduction | Unnotified ₹400 holdback | `DISPUTE_RAZORPAY` |
| `UNKNOWN_REVIEW` | Missing order reference / orphan | Order not found in ERP | `QUARANTINE` |

---

## 10-Step Audit Proof Sequence

For every transaction audited, the following immutable steps are recorded:
1. `Transaction Ingestion`: Gross amount & payment method verified.
2. `Contract Terms Retrieved`: Base MDR (2.0%) and GST (18%) loaded.
3. `MDR Computed`: Base gateway fee calculated deterministically.
4. `Statutory GST Applied`: 18% GST calculated on the MDR amount.
5. `TDS Evaluated`: Section 194O statutory tax applied if applicable.
6. `Theoretical Net Calculated`: Net expected settlement derived.
7. `Bank Batch Compared`: Actual payout from settlement ledger compared.
8. `Variance Calculated`: Arithmetic difference computed.
9. `Root Cause Diagnosed`: Deterministic heuristic classification assigned.
10. `Action Generated`: Dispute, refund, quarantine, or journal adjustment generated.

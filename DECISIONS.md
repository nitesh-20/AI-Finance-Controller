# Architectural Decision Records (ADRs)
**Razorpay AI Buildathon — Track 04: AI Finance Controller ("Run the books and the cash position")**

---

## ADR-001: Python Decimal for Monetary Calculations
* **Status**: Accepted
* **Context**: Standard binary IEEE 754 floating-point numbers introduce minute fractional errors (e.g. `0.1 + 0.2 = 0.30000000000000004`), causing false variance alerts in high-velocity transaction ledgers.
* **Decision**: All financial arithmetic (MDR fees, GST calculations, net settlement calculations, variances) must use Python `Decimal` with explicit `ROUND_HALF_UP` quantization to `0.01` (paise).
* **Consequences**: Zero float drift across millions of transactions; exact mathematical parity with banking ledgers.

---

## ADR-002: Decoupling AI Proposal from Deterministic Verification
* **Status**: Accepted
* **Context**: Large Language Models (LLMs) are probabilistic and prone to arithmetic hallucinations, inconsistent numerical deductions, and sycophantic behavior when given conflicting evidence.
* **Decision**: Adopt the core architecture principle: **"AI proposes. Deterministic verification decides. Human approves high-risk actions."** An LLM is never allowed to directly update the general ledger or alter transaction verification states without passing through `FinancialVerificationGate`.
* **Consequences**: Guarantees **0 invalid auto-posts**, even if the AI model hallucinates or fails.

---

## ADR-003: Sequential 7-Stage Matching Pipeline
* **Status**: Accepted
* **Context**: Financial reconciliation batches contain both trivial 1-to-1 matches (90%+) and ambiguous multi-record cases (subset-sum bulk credits, date drifts, partial refunds). Running expensive LLM inference on all records is cost-prohibitive and slow.
* **Decision**: Implement a 7-stage sequential pipeline:
  1. Exact UTR match
  2. Exact Amount + Date match
  3. Amount + Date window drift (T+1/T+2)
  4. Reference similarity (Narration)
  5. Settlement aggregation (Combinatorial subset-sum)
  6. Partial refund net adjustment
  7. AI residual investigation
* **Consequences**: 90%+ throughput processed in under 55 milliseconds; AI inference is focused only on ambiguous residual edge cases.

---

## ADR-004: Three-Way Ledger Reconciliation (Gateway + Bank + ERP)
* **Status**: Accepted
* **Context**: Traditional two-way reconciliation (Gateway vs Bank) fails to detect merchant ERP inventory discrepancies, unrecorded offline sales, and phantom cart captures.
* **Decision**: Ingest and reconcile three sources simultaneously:
  - Source A: Gateway Settlement Manifest
  - Source B: Bank Statement
  - Source C: Merchant Ledger / ERP Invoice
* **Consequences**: Captures orphan gateway charges with no corresponding customer invoice, and unbilled merchant deliveries with no bank credit.

---

## ADR-005: Ground Truth and Held-Out Evaluation
* **Status**: Accepted
* **Context**: Benchmarking systems on the same synthetic records used to tune matching rules creates severe data leakage and inflated accuracy claims.
* **Decision**: Maintain two separate datasets:
  1. A 500-record benchmark dataset (`seed=42`)
  2. A completely separate 1,000-record held-out dataset (`seed=101`) with explicit ground truth labels (`ground_truth.csv` and `heldout_ground_truth.csv`).
* **Consequences**: Enables genuine scientific evaluation of precision, recall, false positives, and false negatives.

---

## ADR-006: Repositioning Vaani Voice Copilot as an Interface
* **Status**: Accepted
* **Context**: Presenting voice AI as the autonomous decision-maker creates compliance and auditability concerns for enterprise finance teams.
* **Decision**: Vaani is repositioned as a **voice & conversational interface for the AI Finance Controller**. Every response is grounded in deterministic tool execution traces emitted by the backend Python engine.
* **Consequences**: Natural conversational interaction without sacrificing auditability or deterministic financial accuracy.

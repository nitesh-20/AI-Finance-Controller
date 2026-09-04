# AI Finance Controller

An AI-assisted financial reconciliation and verification controller that synchronizes multi-source payment data, investigates ambiguous residual transactions, and verifies all financial calculations deterministically. The system isolates unresolved discrepancies into an auditable exception queue and enforces human authorization for high-risk ledger actions.

> **Core Principle:** AI Proposes. Deterministic Logic Verifies. Human Approves High-Risk Actions.

---

## Razorpay AI Builder — Track 04

**Challenge Track:** *AI Finance Controller — "Run the books and the cash position"*

The track requires an agent that closes a finance-ops loop across a 50+ record batch of synthetic data, reporting its match rate and unresolved exceptions.

**Implementation Highlights:**
- **1,000-Record Held-Out Evaluation**: Evaluated on an adversarial dataset (`seed=101`), 20x larger than the 50-record track minimum.
- **3-Way Multi-Source Ledger**: Synchronizes gateway settlements (modeled on Razorpay settlement formats), bank statements (MT940/CSV), and merchant ERP invoices.
- **Measured Accuracy**: **91.0% auto-match rate**, **100.0% verified auto-match precision**, and **100.0% clean-record recall**.
- **Honest Exceptions**: Isolates exactly **90 exceptions** with root causes and evidence trails rather than forcing false matches.
- **Safety Invariant**: **0 incorrect auto-posts observed** across the 1,000-record held-out evaluation.

---

## The Problem

Digital merchants receive transaction data from three disconnected sources: gateway settlements, bank statements, and ERP sales ledgers. Finance operations teams spend hours manually cross-checking these records to close books and verify cash positions.

Discrepancies commonly arise from:
- **Settlement timing**: T+1/T+2 banking cut-offs and weekend settlement drift.
- **Fee and tax variances**: MDR tier variations, statutory 18% GST rounding, and TDS withholding.
- **Operational deductions**: Partial/full refunds, unnotified chargeback reserves, and bank handling fees.
- **Data gaps**: Duplicate captures, reused UTRs, missing ERP invoices, and truncated narrations.

A generative LLM alone is fundamentally unsuitable for financial reconciliation. Probabilistic language models hallucinate arithmetic, drop fee schedules, and fabricate matches.

The AI Finance Controller automates repetitive matching while preventing unverified AI outputs from updating the ledger.

---

## How It Works

```text
Gateway Settlement Data (Modeled on Razorpay Formats)
                         ↓
             Bank Statement (MT940 / CSV)
                         ↓
             Merchant Ledger / ERP Invoice
                         ↓
               Data Normalization
                         ↓
         7-Stage Deterministic Matching Engine
                         ↓
             AI Residual Investigation
                         ↓
             Financial Verification Gate
                         ↓
             ┌───────────┴───────────┐
             ↓                       ↓
          MATCHED                EXCEPTION
      (Auto-Posted)         (Human Approval Gate)
                                     ↓
                        Closed-Loop Post-Action Audit
```

### Core Flow
1. **Multi-Source Ingestion**: Ingests gateway settlements (gross, MDR, GST, net, UTR), bank statements, and ERP invoices.
2. **7-Stage Matching**: Resolves unambiguous records in hierarchical order (exact UTR to aggregation and refunds).
3. **AI Residual Investigation**: Formulates candidate hypotheses for ambiguous residuals.
4. **Financial Verification Gate**: Audits every candidate match against strict Decimal debit-credit arithmetic.
5. **Exception Routing**: Unverified or high-risk items route to the Exception Center with evidence and suggested actions.
6. **Human Approval Gate**: Operators authorize high-risk actions (disputes, adjustments, refunds, quarantines).
7. **Post-Action Re-Verification**: Re-verifies executed actions to drive variance to ₹0.00 and logs immutable audit trails.

*Note: Gateway data is synthetically generated and modeled around Razorpay settlement formats. The repository does not connect to live Razorpay or banking APIs.*

---

## Why AI + Deterministic Logic

In financial operations, probabilistic reasoning and deterministic accounting have distinct roles:

| Responsibility | AI Layer (Generative & Semantic) | Deterministic Financial Engine |
| :--- | :--- | :--- |
| **Monetary Arithmetic** | ❌ Prone to hallucinations & rounding drift | ✅ Authoritative Python `Decimal` (paise-accurate) |
| **Tax & Fee Schedules** | ❌ Approximates or drops fee schedules | ✅ Statutory 18% GST and contractual MDR validation |
| **Posting Authority** | ❌ **Never** authorized to clear transactions | ✅ Sole gatekeeper for ledger updates and auto-posts |
| **Bank Narrations** | ✅ Parses cryptic UPI/NEFT references & aliases | ❌ Limited to exact regex or strict keyword rules |
| **Residual Investigation** | ✅ Generates structured root-cause hypotheses | ❌ Cannot infer business context from unstructured text |
| **Action Remediation** | ✅ Suggests prioritized operational actions | ✅ Re-audits executed actions to confirm zero variance |

### The Enforcement Invariant
AI proposals **never directly become financial truth**.

When the AI Residual Resolver generates a candidate proposal (`proposal_type`, `candidate_records`, `proposed_net`, `reasoning`):
1. The proposal is routed to the **Financial Verification Gate**.
2. The gate independently recalculates the financial waterfall using authoritative ledger values.
3. If the proposed net diverges from calculated net settlement, or if variance exceeds the threshold:
   - **Auto-posting is strictly blocked.**
   - The proposal is rejected with a machine-readable reason.
   - The transaction is quarantined in the Exception Queue for operator review.

---

## Reconciliation Engine

The matching pipeline (`backend/app/services/matching/deterministic_engine.py`) implements 7 sequential stages, resolving simple, deterministic pairings before complex strategies execute:

1. **`EXACT_UTR`**: Matches unique transaction references between gateway settlement and bank statement.
2. **`EXACT_AMOUNT_DATE`**: Matches exact net payout amounts for same-day calendar settlements.
3. **`AMOUNT_DATE_WINDOW`**: Reconciles amounts across T+1 and T+2 banking cycle drift.
4. **`REFERENCE_SIMILARITY`**: Extracts Order IDs, Invoice numbers, or ARNs from unstructured bank narrations.
5. **`SETTLEMENT_AGGREGATION`**: Combinatorial subset-sum solver matching single bulk bank credits to multiple settlement batches.
6. **`PARTIAL_REFUND_ADJUSTMENT`**: Reconciles net payouts adjusted for customer refunds and cancellations.
7. **`UNRESOLVED_RESIDUALS`**: Escalates ambiguous residuals to the AI Residual Resolver for structured hypothesis generation.

---

## Financial Verification Gate

The Verification Gate (`backend/app/services/verifier/verification_gate.py`) provides the mathematical barrier protecting the ledger.

### Implemented Formula
For every transaction:

$$\text{MDR Amount} = \text{Gross Amount} \times \text{Contracted MDR Rate (2.00\%)}$$

$$\text{GST on MDR} = \text{MDR Amount} \times \text{Statutory GST Rate (18.00\%)}$$

$$\text{Expected Net Settlement} = \text{Gross} - \text{MDR} - \text{GST} - \text{TDS} - \text{Refunds} - \text{Chargebacks} - \text{Other Deductions}$$

$$\text{Variance} = \text{Expected Net Settlement} - \text{Actual Bank Credit}$$

### Verification Rules
1. **Paise-Level Decimal Arithmetic**: Uses Python `Decimal` with strict `ROUND_HALF_UP` quantization to `0.01` (1 paise). Floating-point math is prohibited.
2. **Variance Threshold**: A transaction is verified if and only if $|\text{Variance}| \le \text{₹}0.05$ (5 paise tolerance for currency rounding).
3. **Unique UTR Enforcement**: Re-settling an already credited UTR is blocked (`DUPLICATE_UTR_DETECTED`).
4. **Statutory Tax Validation**: GST on MDR must match the statutory 18% schedule (within ₹0.02).

Proposals failing verification receive `verification_status: "REJECTED"`, blocking auto-posting. Across the 1,000-record held-out evaluation, **0 incorrect auto-posts were observed**.

---

## Evaluation Results

Measured via `scripts/evaluate_controller.py` on the **1,000-record held-out synthetic dataset** (`seed=101`) containing 25 distinct adversarial anomaly types:

| Metric | Naive LLM Baseline | AI Finance Controller |
| :--- | :---: | :---: |
| **Total Records Processed** | 1,000 | **1,000** |
| **Clean Matches** | 985 | **910** |
| **Auto-Match Rate** | 98.5% *(unverified)* | **91.0%** |
| **Verified Auto-Match Precision** | 92.39% | **100.0%** |
| **Clean-Record Recall** | N/A | **100.0%** |
| **False Positives** | 75 | **0** |
| **Incorrect Auto-Posts Observed** | 75 | **0** |
| **Honest Exceptions Isolated** | 15 *(omitted 75)* | **90** |
| **Total Value Reconciled** | Unverified | **₹19,942,363.32** |
| **Total Value at Risk** | Unknown | **₹814,357.83** |
| **Deterministic Engine Processing Time** | 0.000s | **0.052s** |
| **Deterministic Latency (p50)** | — | **0.052 ms / record** |

*Performance Note: Processing duration and latency reflect local Python deterministic calculation and matching engine speed, not remote LLM API latency.*

### Metric Definitions
- **Auto-Match Precision**: Correct Verified Auto-Matches / Total Verified Auto-Matches = 910 / 910 = **100.0%**.
- **Clean-Record Recall**: Correctly Recovered Clean Matches / All Ground-Truth Clean Matches = 910 / 910 = **100.0%**.
- **Baseline Comparison**: The Naive baseline matched blindly on references without debit-credit checks, reporting an inflated 98.5% match rate while falsely posting 75 invalid transactions (duplicate UTRs, fee discrepancies, partial refunds). The AI Finance Controller caught all 75 invalid pairings, isolating 90 honest exceptions.

---

## Adversarial Evaluation

The dataset generator (`data/synthetic/generator.py`) injects 25 realistic merchant anomalies across 10 categories to test beyond clean happy-path records:

- **Duplicate Transactions / UTRs**: Gateway reused UTRs; dual capture of identical orders.
- **Settlement Timing Issues**: T+1 bank credit delays; T+2 weekend and clearing holiday drift.
- **Refunds & Chargebacks**: Partial customer order cancellations; full refunds; unitemized ₹400 chargeback holdbacks.
- **MDR & GST Discrepancies**: International card rate misclassifications (3.5% vs 2.0%); GST rounding divergences.
- **Missing Records**: Orphan gateway settlements missing in bank statements; missing ERP invoices.
- **Aggregation & Split Settlements**: Multi-settlement bulk bank credits (subset-sum); payments split across batches.
- **Reference & Narration Variations**: Truncated UPI/NEFT references; merchant name aliases.
- **Amount Mismatches**: Unannounced bank handling fees; incorrect transfer amounts.
- **Ambiguous Cases**: Cryptic narrations lacking identifiers; identical-amount transaction collisions.

---

## Safety Demonstration

The platform includes an automated failure injection safety test (`test_failure_injection.py` and UI trigger `"Simulate Unsafe AI Proposal"`):

```text
Adversarial Input: AI Proposal claims "MATCHED" with net payout ₹12,156.18
                   Actual Bank Credit is ₹11,756.18 (₹400 variance)
                                 ↓
            Verification Gate independently calculates waterfall
                     Expected Net: ₹12,156.18
                     Actual Credit: ₹11,756.18
                     Variance: ₹400.00 (|Variance| > ₹0.05)
                                 ↓
           Result: Verification Fails ("VARIANCE_DETECTED")
                   Auto-posting is strictly BLOCKED
                   Record quarantined in Exception Queue
```

If an AI proposal hallucinates a match or diverges arithmetically, the Verification Gate catches the discrepancy, blocks auto-posting, and flags an exception.

---

## Exceptions & Human-in-the-Loop

Unresolved cases are never forced into matches. The system isolates them in an Exception Queue with:
- **Root-Cause Diagnosis**: Anomaly classification (e.g. `CHARGEBACK_RESERVE`, `WRONG_MDR_TIER`, `DUPLICATE_UTR`).
- **Audit Waterfall**: Step-by-step arithmetic breakdown of gross, fees, taxes, deductions, and bank credit.
- **Evidence Trail**: Reference numbers, ARN tags, and settlement timestamps.
- **Recommended Action**: Action suggestion (`DISPUTE_RAZORPAY`, `JOURNAL_ADJUSTMENT`, `QUARANTINE`, `REFUND_DUPLICATE`).
- **Operational Priority**: Ranked by monetary impact and SLA urgency.

### Closed-Loop Post-Action Re-Verification
1. **Operator Approval**: High-risk financial actions require human authorization.
2. **Execution**: The action executes under a tracked case ID (e.g. `DISP_2026_001`).
3. **Re-Verification**: The Verification Gate re-audits the transaction.
4. **Variance Cleared**: Transaction variance drops to **₹0.00**.
5. **Ledger & Audit Update**: The Finance Health Score recalculates, and an immutable audit record is stored.

---

## Vaani — Finance Operations Copilot

Vaani provides a conversational and voice interface for the controller:
- **Tool-Grounded Answers**: Calls backend tools (`audit_transaction`, `get_cash_position`, `execute_action`) rather than generating unverified responses.
- **Visible Execution Traces**: Displays real-time tool logs (e.g. `✓ audit_transaction: Diagnosed ₹400.00 variance on TXN_98217345`).
- **Bilingual Interaction**: Supports English, Hindi, and Hinglish queries (*"TXN_98217345 ka status kya hai?"* or *"What is our cash position?"*).
- **Deterministic Fallbacks**: Employs fast heuristic fallbacks when offline or operating without API keys.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, TailwindCSS, Lucide Icons, Motion
- **Backend**: Python 3.11+, FastAPI, Pydantic v2, Python `Decimal` engine
- **AI & Reasoning**: Google Gemini (`gemini-2.5-flash` via `@google/genai`) with offline deterministic fallback
- **Testing & Evaluation**: Python `unittest` (54 automated tests), synthetic adversarial generator

---

## Project Structure

```text
ai-finance-controller/
├── backend/app/services/matching/        # 7-stage deterministic matching pipeline
├── backend/app/services/verifier/        # Decimal verification gate & safety rules
├── backend/app/services/reconciliation/  # 3-way multi-source orchestrator
├── backend/app/services/ai/              # AI residual resolver & provider abstractions
├── backend/app/api/                      # REST API endpoints
├── backend/tests/                        # 54 unit, integration, and safety tests
├── frontend/src/features/                # Reconciliation, Exceptions, Settlements, Audit, Vaani
├── data/                                 # 500-record benchmark and 1,000-record held-out datasets
├── scripts/                              # evaluate_controller.py, run_tests.py, benchmark.py
├── reports/evaluation/                   # Evaluation reports (latest.json, latest.md)
└── docs/                                 # Architectural specifications and ADRs
```

---

## Running Locally

### 1. Prerequisites
- Python 3.11+
- Node.js v20+ or v22+
- npm v10+

### 2. Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --port 8000 --reload
```
*API documentation available at `http://localhost:8000/docs`.*

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Application available at `http://localhost:5173`.*

### 4. Run Automated Tests
```bash
python3 scripts/run_tests.py
```
*Executes all 54 unit, integration, and safety tests.*

### 5. Run Evaluation Benchmark
```bash
python3 scripts/evaluate_controller.py
```

---

## Reproduce the Evaluation

To reproduce the benchmark:

1. *(Optional)* Regenerate datasets with fixed random seeds:
   ```bash
   python3 data/synthetic/generator.py
   ```
   Generates `data/synthetic/` (500 records, `seed=42`) and `data/evaluation/` (1,000 records, `seed=101`).

2. Run the evaluation script:
   ```bash
   python3 scripts/evaluate_controller.py
   ```

The script evaluates the 1,000-record held-out dataset, validates against ground truth, prints the benchmark comparison, and writes `reports/evaluation/latest.json` and `reports/evaluation/latest.md`.

---

## Limitations

- **Synthetic Evaluation Data**: Evaluated on synthetic data modeled on Indian merchant banking and Razorpay settlement formats. Not connected to live production records.
- **Simulation Mode for External Actions**: Action executions (disputes, bank transfers, adjustments) operate in safe simulation mode with mock external gateways.
- **Cash Forecasting Scope**: 7-day liquidity forecasts are statistical projections based on historical settlement cycles, not guaranteed bank credits.
- **No Live Banking Integration**: Does not connect to live banking or payment gateway APIs without production credentials.

---

## Final Principle

> “Finance automation should not trade accuracy for convenience.  
> AI investigates ambiguity, deterministic logic verifies financial truth, and uncertain cases remain visible to humans.”

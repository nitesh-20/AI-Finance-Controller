# AI Finance Controller

### AI-powered finance operations, reconciliation & settlement intelligence.

AI Finance Controller is an AI-powered finance operations platform that helps merchants reconcile payment and settlement records, detect financial discrepancies, understand settlement variances, monitor cash position, and interact with financial data through Vaani, a voice-enabled finance copilot.

---

## Razorpay AI Buildathon — Track 04

**Challenge Track:** *AI Finance Controller — "Run the books and the cash position"*

In high-velocity commerce environments, finance and accounting teams struggle with the manual friction of multi-source ledger reconciliation, unitemized gateway fees, chargeback deductions, and delayed bank payout cycles. 

This project directly addresses Track 04 by implementing an autonomous, end-to-end finance operations system across a batch of 50+ realistic Indian merchant transactions. It executes deterministic arithmetic reconciliation, measures match throughput, detects discrepancies, explains root causes with supporting evidence, projects a 7-day forward liquidity runway, and exposes an auditable copilot interface for operational review.

> **Test Mode Notice:** This prototype is designed for the Razorpay Buildathon. It executes against a deterministic synthetic dataset simulating Indian merchant gateway manifests, MDR fees, and bank credits. It does not connect to live production Razorpay banking infrastructure.

---

## The Problem

Finance teams must continuously compare merchant order manifests, gateway captures, settlement payout batches, contracted Merchant Discount Rates (MDR), Goods & Services Tax (GST), Tax Deducted at Source (TDS), and statutory bank credits.

Manual reconciliation is:
* **Time-consuming**: Sifting through thousands of line items across fragmented CSVs and gateway dashboards.
* **Error-prone**: Subtle decimal rounding errors and fee tier variations slip past manual inspection.
* **Difficult to audit**: Decisions to adjust or dispute lack structured, timestamped evidence trails.
* **Hard to scale**: Volume spikes lead to growing backlogs of unverified transactions.

The critical requirement is not just flagging that a mismatch exists, but answering:
1. **Why is there a mismatch?** (Root-cause classification)
2. **How much money is affected?** (Exact variance waterfall)
3. **What evidence supports the finding?** (Gateway traces and contractual comparisons)
4. **What action should be taken next?** (Dispute, Quarantine, or Journal Adjustment)

---

## The Solution

AI Finance Controller operates as a deterministic finance operations control layer that strictly decouples **authoritative Python arithmetic** from **AI reasoning and natural language explanation**.

```text
Transaction Manifests & Gateway Batches
                  │
                  ▼
         Data Normalization
                  │
                  ▼
   Deterministic Python Reconciliation Engine
                  │
                  ▼
         Settlement Verification
                  │
                  ▼
         Variance Detection
                  │
                  ▼
       AI Root-Cause Diagnostics
                  │
                  ▼
         Recommended Actions
                  │
                  ▼
       Immutable Audit Trail
                  │
                  ▼
   Fintech Dashboard & Vaani Voice Copilot
```

---

## Key Features

### 1. AI Reconciliation Engine
Processes 50+ financial records and automatically calculates:
* **Processed Records**: 52 total merchant transactions
* **Clean Matches**: 37 verified records
* **Pending Inflow**: 10 records in T+1 settlement cycle
* **Isolated Exceptions**: 5 anomaly records
* **Match Rate**: 71.2% deterministic match throughput
* **Gross & Net Volumes**: Aggregate monetary volume and fee breakdowns

### 2. AI Transaction Auditor & Waterfall
Provides granular, line-item financial auditing for any transaction:
* Calculates theoretical settlement using contracted MDR and 18% GST.
* Compares expected payout against actual bank credit.
* Isolates variance down to exact paise.
* Generates evidence trails and confidence-rated root-cause diagnoses.

### 3. Settlement Intelligence
Monitors gateway payout batches and statutory tax deductions:
* Gross settlement volume vs net bank credits (e.g. HDFC Bank `•••• 4892`).
* Itemized 2.0% MDR fee deductions and 18% GST on MDR.
* Real-time payout batch status and bank Unique Transaction References (UTRs).
* Automatic detection of settlement fee variances and chargeback holdbacks.

### 4. Exception Center
Centralized operations queue to inspect, dispute, and resolve anomalies:
* Filter by severity: `Critical`, `High`, `Medium`, `Low`, `Unresolved`, `Resolved`.
* Sort by `Variance Amount`, `Severity`, `Confidence Score`, and `Detected Date`.
* Side-by-side evidence drawer comparing merchant orders against gateway transfers.

### 5. Cash Position & 7-Day Liquidity Forecast
Calculates real-time merchant liquidity:
* **Available Cash**: ₹2.46L current liquid capital.
* **Pending Settlement Inflow**: ₹57.4K in T+1 pipeline.
* **Refund Liability Buffer**: ₹12.5K reserve obligation.
* **7-Day Rolling Cash Runway**: Daily forward closing balance projection with confidence ratings.

### 6. Vaani — Finance Copilot
Autonomous voice and chat copilot operating with sub-2ms backend response times:
* Speaks in natural Hindi/English (Hinglish).
* Answers finance questions using live data: *"Why was TXN_98217345 flagged?"*, *"Explain the settlement calculation for TXN_98217345"*, *"What is today's reconciliation rate?"*, *"What's our cash position?"*.
* Emits transparent tool execution traces (e.g. `✓ audit_transaction (Diagnosed Unmapped Chargeback Reserve)`).

### 7. Transparent 10-Step Audit Trail
Every reconciliation decision is accompanied by a 10-step auditable event log:
1. Transaction Received
2. Payment Details Normalized
3. Contracted MDR Loaded
4. MDR Calculated
5. Statutory GST Calculated
6. TDS Evaluated
7. Theoretical Settlement Calculated
8. Actual Settlement Compared
9. Variance Calculated
10. Root Cause & Recommendation Generated

### 8. Statutory Report Exports
Client-side and server-side PDF generation for compliance audits:
* Reconciliation Ledger Statements
* Settlement Payout Summaries
* Exception Audit Statements

---

## AI Transaction Auditor

The system strictly enforces deterministic mathematical calculations in Python:

$$\text{MDR Amount} = \text{Gross Amount} \times \text{Contracted MDR Rate (e.g. 2.0\%)}$$
$$\text{GST on MDR} = \text{MDR Amount} \times 18\%$$
$$\text{TDS} = \text{Gross Amount} \times \text{TDS Rate (Section 194-O, if applicable)}$$
$$\text{Theoretical Net Settlement} = \text{Gross Amount} - \text{MDR Amount} - \text{GST on MDR} - \text{TDS}$$
$$\text{Variance} = \text{Theoretical Net Settlement} - \text{Actual Net Settled}$$

### Calculation Example:

| Step | Component | Rate / Formula | Amount (₹) |
| :--- | :--- | :--- | :--- |
| 1 | **Gross Amount** | Captured transaction value | **₹20,000.00** |
| 2 | **Contracted MDR** | $2.00\%$ of ₹20,000.00 | **-₹400.00** |
| 3 | **Statutory GST** | $18.00\%$ of ₹400.00 | **-₹72.00** |
| 4 | **TDS (194-O)** | $0.00\%$ (Exempt / Threshold) | **-₹0.00** |
| 5 | **Theoretical Net Settlement** | $20,000 - 400 - 72$ | **₹19,528.00** |
| 6 | **Actual Bank Credit** | Gateway payout received | **₹19,128.00** |
| 7 | **Variance Difference** | $19,528.00 - 19,128.00$ | **₹400.00 (Flagged)** |

The AI layer interprets this calculation, correlates the ₹400 variance against batch deductions, assigns **95% confidence**, diagnoses an `Unmapped Chargeback Reserve`, and recommends `DISPUTE_RAZORPAY`.

---

## AI Agent Architecture

```text
                        ┌─────────────────────────────────────┐
                        │       FinanceControllerAgent        │
                        │ (Intent Routing · Tool Calling)     │
                        └──────────────────┬──────────────────┘
                                           │
         ┌─────────────────────────────────┼─────────────────────────────────┐
         ▼                                 ▼                                 ▼
┌──────────────────┐             ┌──────────────────┐             ┌──────────────────┐
│  Reconciliation  │             │ Settlement Audit │             │  Cash Forecast   │
│      Agent       │             │      Agent       │             │      Agent       │
└────────┬─────────┘             └────────┬─────────┘             └────────┬─────────┘
         │                                │                                │
         └────────────────────────────────┼────────────────────────────────┘
                                           │
                                  ┌────────▼────────┐
                                  │  Finance Tools  │
                                  └────────┬────────┘
                                           │
                 ┌─────────────────────────┼─────────────────────────┐
                 ▼                         ▼                         ▼
        ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
        │  Transactions   │       │   Settlements   │       │     Ledger      │
        └────────┬────────┘       └────────┬────────┘       └────────┬────────┘
                 │                         │                         │
                 └─────────────────────────┼─────────────────────────┘
                                           │
                        ┌──────────────────▼──────────────────┐
                        │   Deterministic Python Engine       │
                        │    (Waterfall & Variance Math)      │
                        └──────────────────┬──────────────────┘
                                           │
                        ┌──────────────────▼──────────────────┐
                        │     AI Root-Cause Diagnostics       │
                        │ (Confidence · Evidence · Actions)   │
                        └──────────────────┬──────────────────┘
                                           │
                        ┌──────────────────▼──────────────────┐
                        │        Immutable Audit Ledger       │
                        └─────────────────────────────────────┘
```

---

## AI vs Deterministic Logic

Financial workflows demand zero tolerance for hallucinated monetary numbers. The system establishes clear boundaries:

| Layer | Technology | Primary Responsibilities |
| :--- | :--- | :--- |
| **Deterministic Python Layer** | Python 3.14, Pydantic, Pandas | • Exact monetary arithmetic & decimal precision<br>• Match/mismatch validation rules<br>• Fee, GST, and TDS deductions<br>• Variance calculations & percentage aggregations<br>• State transitions & audit event logging |
| **AI Intelligence Layer** | FinanceControllerAgent, Gemini Live / LLM | • Natural-language query parsing & intent detection<br>• Root-cause classification & evidence synthesis<br>• Action recommendation (`DISPUTE`, `QUARANTINE`)<br>• Multi-modal voice interaction via Vaani copilot<br>• Explainability summaries for finance operators |

---

## Tech Stack

### Frontend
* **Core Framework**: React 19, TypeScript, Vite 6
* **Styling**: Vanilla CSS, TailwindCSS v4
* **Icons & UI**: Lucide React
* **PDF Export**: jsPDF, jsPDF-AutoTable
* **Audio Processing**: Web Audio API, AudioWorklet PCM Streamer

### Backend
* **Runtime**: Python 3.14
* **Web Framework**: FastAPI (Async API routes, CORS middleware)
* **Data Validation**: Pydantic v2 (Strict typing and schemas)
* **Data Processing**: Pandas, NumPy
* **Server**: Uvicorn ASGI

### AI & Agent Layer
* **Agent Architecture**: Tool-calling multi-agent orchestrator (`FinanceControllerAgent`)
* **Live Audio Streaming**: Gemini Live API / Web Speech fallback
* **Sidecar Engine**: LiveKit Agents 1.x, Deepgram Nova-2 STT, ElevenLabs Neural TTS

### Testing
* **Test Runner**: Pytest

---

## Project Structure

```text
ai-finance-controller/
├── backend/                              # Python FastAPI Intelligence Backend
│   ├── app/
│   │   ├── main.py                       # FastAPI application entrypoint & routing
│   │   ├── core/
│   │   │   ├── config.py                 # Application settings & constants
│   │   │   └── logging.py                # Structured logging configuration
│   │   ├── models/
│   │   │   ├── auditor.py                # Transaction auditor & waterfall schemas
│   │   │   ├── transaction.py            # Transaction data models
│   │   │   ├── settlement.py             # Settlement overview & batch models
│   │   │   ├── reconciliation.py         # Batch result & metrics schemas
│   │   │   ├── exception.py              # Financial exception & evidence models
│   │   │   ├── finance.py                # Cash position & insight models
│   │   │   └── agent.py                  # Agent chat traces & audit schemas
│   │   ├── services/
│   │   │   ├── transaction_auditor.py    # Deterministic waterfall & root cause engine
│   │   │   ├── reconciliation_engine.py  # 10-step batch reconciliation engine
│   │   │   ├── settlement_service.py     # Settlement payout & fee audit service
│   │   │   ├── cash_forecast_service.py  # Cash runway & 7-day forecast service
│   │   │   ├── exception_service.py      # Exception management & status updates
│   │   │   ├── transaction_service.py    # Transaction ingestion & queries
│   │   │   ├── audit_service.py          # Immutable audit event ledger
│   │   │   └── report_service.py         # Statutory executive report generator
│   │   ├── tools/                        # Agent-callable tools
│   │   │   ├── reconciliation_tools.py
│   │   │   ├── settlement_tools.py
│   │   │   ├── forecasting_tools.py
│   │   │   └── report_tools.py
│   │   ├── agents/
│   │   │   └── finance_controller.py     # Central orchestrator with reasoning traces
│   │   ├── api/                          # REST API Routers
│   │   │   ├── reconciliation.py         # /api/reconciliation
│   │   │   ├── settlements.py            # /api/settlements
│   │   │   ├── exceptions.py             # /api/exceptions
│   │   │   ├── cash.py                   # /api/cash
│   │   │   ├── insights.py               # /api/insights
│   │   │   ├── agent.py                  # /api/agent/chat
│   │   │   ├── reports.py                # /api/reports
│   │   │   └── audit.py                  # /api/audit
│   │   └── data/
│   │       ├── synthetic_transactions.json # 52-record merchant dataset
│   │       └── settlements.json          # Multi-day settlement batches
│   ├── tests/
│   │   └── test_reconciliation_auditor.py # Automated unit & integration tests
│   └── requirements.txt
│
├── Vaani-AI/                             # React + Vite Production Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx                # Corporate header with Ask Vaani trigger
│   │   │   ├── Sidebar.tsx               # 4-tab primary navigation
│   │   │   ├── FinanceDashboard.tsx      # Overview command center
│   │   │   ├── ReconciliationCenter.tsx  # Reconciliation ledger & Audit Drawer
│   │   │   ├── SettlementIntelligence.tsx# Payout batches & 7-day cash runway
│   │   │   ├── ExceptionCenter.tsx       # Operations queue & evidence drawer
│   │   │   └── VoiceAgent.tsx            # Vaani copilot modal with tool traces
│   │   ├── context/
│   │   │   └── FinanceContext.tsx        # Global state, backend sync & PDF export
│   │   ├── services/
│   │   │   ├── api.ts                    # FastAPI HTTP client with timeout guards
│   │   │   └── gemini.ts                 # Live audio streaming service
│   │   ├── data/                         # Local dataset mirror
│   │   ├── types.ts                      # TypeScript interfaces
│   │   ├── App.tsx                       # Main application shell
│   │   └── index.css                     # Design tokens & typography
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
│
├── orion_voiceagent-main/                # WebRTC Real-Time Voice Sidecar (LiveKit)
│   ├── backend/                          # Python LiveKit agent
│   ├── client/                           # WebRTC client interface
│   └── README.md
│
├── .env.example                          # Root environment template
└── README.md
```

---

## Reconciliation Workflow

1. **Ingestion & Normalization**: Ingests merchant orders, gateway manifests, and bank payout statements.
2. **Schema Validation**: Validates gross amounts, payment methods, transaction references, and timestamps.
3. **MDR & GST Audit**: Applies contracted 2.00% MDR tier and statutory 18% GST.
4. **TDS Evaluation**: Computes withholding tax where applicable (Section 194-O).
5. **Waterfall Execution**: Generates the theoretical net settlement amount.
6. **Bank Settlement Comparison**: Compares theoretical net payout against actual bank credit.
7. **Variance Detection**: Surfaces discrepancies down to the exact paise.
8. **Root-Cause Diagnostics**: Maps anomalies to predefined classification rules with confidence ratings.
9. **Recommendation Generation**: Suggests operational actions (`DISPUTE_RAZORPAY`, `JOURNAL_ADJUSTMENT`, `QUARANTINE`).
10. **Audit Ledger Persistence**: Writes timestamped calculation steps to the immutable audit log.
11. **Dashboard & Copilot Update**: Updates the UI ledger and makes findings queryable via Vaani.

---

## Supported Root Causes

The system implements 10 diagnostic classifications:

| Classification | Signal / Condition | Default Action |
| :--- | :--- | :--- |
| `MATCHED` | Theoretical settlement matches bank credit ($\lvert\Delta\rvert \le \text{₹}0.05$) | `RECONCILE_CLEAN` |
| `Wrong MDR Tier Applied` | Effective fee rate exceeds contracted 2.0% (e.g. 3.5% international card) | `JOURNAL_ADJUSTMENT` |
| `GST / Rounding Error` | Fractional discrepancy ($0.05 < \lvert\Delta\rvert \le \text{₹}1.50$) due to tax rounding | `JOURNAL_ADJUSTMENT` |
| `Unmapped Chargeback Reserve` | Unitemized ₹400 gateway deduction on settled batch | `DISPUTE_RAZORPAY` |
| `Missing Settlement` | Merchant payment captured but bank payout batch omitted | `DISPUTE_RAZORPAY` |
| `Duplicate Transaction` | Dual capture for the same order within a sub-minute window | `REFUND_DUPLICATE` |
| `Currency Markup` | Cross-border FX markup deducted without separate line item | `JOURNAL_ADJUSTMENT` |
| `Settlement Fee Variance` | Unexplained deduction on settlement batch transfer | `DISPUTE_RAZORPAY` |
| `TDS Difference` | Withholding tax variance under Section 194-O | `JOURNAL_ADJUSTMENT` |
| `Unknown / Requires Review` | Gateway capture with no corresponding merchant ERP order | `QUARANTINE` |

---

## Recommended Actions

* **`DISPUTE_RAZORPAY`**: Recommended when gateway deductions or omitted payouts require raising a formal dispute with bank/gateway references (ARN / UTR).
* **`JOURNAL_ADJUSTMENT`**: Recommended when differences (e.g. international card surcharges, GST rounding) represent legitimate accounting adjustments.
* **`QUARANTINE`**: Recommended when payment manifests cannot be reconciled with internal orders, holding the transaction for manual fraud/ERP review.
* **`REFUND_DUPLICATE`**: Recommended when dual captures occur, prompting an immediate customer refund to prevent chargebacks.
* **`RECONCILE_CLEAN`**: Confirms that mathematical and reference audits verified clean settlement.

---

## Voice AI: Vaani — Finance Copilot

Vaani acts as a conversational finance copilot integrated directly into the header navigation:

* **Sub-2ms Backend Queries**: Queries the Python `FinanceControllerAgent` and returns deterministic answers without hallucinations.
* **Visible Agent Traces**: Displays real-time tool execution logs (e.g. `✓ audit_transaction (Diagnosed ₹400 variance)`).
* **Automated UI Navigation**: Voice commands automatically navigate the dashboard to the relevant tab and open detail drawers.

### Example Queries Supported:
* *"What is today's reconciliation rate?"* $\to$ Returns 71.2% match rate across 52 records.
* *"Why was TXN_98217345 flagged?"* $\to$ Explains the ₹400 unitemized chargeback deduction.
* *"Explain the settlement calculation for TXN_98217345"* $\to$ Breaks down the full mathematical waterfall.
* *"Show my biggest settlement mismatch."* $\to$ Highlights the ₹18,063.40 missing payout.
* *"What's our cash position?"* $\to$ Reports ₹2.46L available cash and ₹2.91L projected net liquidity.
* *"Which transactions should be quarantined?"* $\to$ Identifies orphan gateway capture `TXN_GWAY_ORPHAN_99`.

---

## Reliability & Auditability

1. **Deterministic Calculations**: No LLM generates or modifies financial figures. All arithmetic is executed in Python.
2. **Strict Schema Validation**: All API responses and waterfall structures are validated by Pydantic models.
3. **Evidence-Grounded Explanations**: AI reasoning references verified transaction metadata (ARNs, UTRs, order IDs, fee schedules).
4. **Full Traceability**: Every transaction audit contains an immutable 10-step trail detailing each stage of the matching pipeline.

---

## Demo Flow

1. **Overview Dashboard**: Observe aggregate metrics (₹3.26L processed, ₹2.46L available cash, 71.2% match rate).
2. **Run Auto-Reconciliation**: Click **"Run Auto-Reconciliation"** on the Reconciliation page to trigger the 10-step matching pipeline.
3. **Transaction Auditor**: Click any transaction row (e.g. `TXN_98217345`) to open the right-side detail drawer.
4. **Financial Waterfall**: Inspect the Gross $\to$ MDR $\to$ GST $\to$ Net Settlement $\to$ Variance progression.
5. **AI Audit Finding**: Review the diagnosed root cause (`Unmapped Chargeback Reserve`, 95% confidence) and click **"Create Dispute"**.
6. **Exception Operations Queue**: Navigate to Exceptions, apply severity filters (`Critical`, `High`), and sort by `Variance`.
7. **Settlements & Runway**: Inspect settlement batches, MDR fee deductions, and the interactive 7-day cash forecast.
8. **Ask Vaani**: Click **"Ask Vaani"** in the header, click a prompt chip (*"₹400 ka difference kahan se aaya?"*), and observe the agent execution traces and voice response.
9. **Export Report**: Click **"Export Report"** to generate a statutory audit PDF statement.

---

## Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/nitesh-20/AI-Finance-Controller.git
cd AI-Finance-Controller
```

### 2. Python FastAPI Backend Setup
```bash
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate       # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start backend server
python3 -m uvicorn app.main:app --port 8000 --host 0.0.0.0 --reload
```
*Backend API documentation available at: `http://localhost:8000/docs`*

### 3. React Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
*Frontend application available at: `http://localhost:5173` (or `http://localhost:3000` in production)*

---

## Environment Variables

Copy the provided `.env.example` templates to configure environment variables:

```bash
# Root template
cp .env.example .env

# Backend template
cp backend/.env.example backend/.env

# Frontend template
cp frontend/.env.example frontend/.env
```

### Required Variables:
```env
# Google Gemini API Key (Required for Live Voice Copilot)
GEMINI_API_KEY=your_gemini_api_key_here
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Backend Ports
PORT=8000
HOST=0.0.0.0
```

---

## API Reference

The FastAPI backend exposes the following structured REST endpoints under `/api`:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health status and Buildathon metadata |
| `GET` | `/api/reconciliation/run` | Executes 10-step batch reconciliation over 52 records |
| `GET` | `/api/reconciliation/metrics` | Returns match rate, total processed, and variance totals |
| `GET` | `/api/reconciliation/records` | Returns all processed records with classification tags |
| `GET` | `/api/reconciliation/audit/{txn_id}` | Returns deterministic financial waterfall & 10-step audit trail |
| `GET` | `/api/reconciliation/audits` | Returns audit results for all transactions in the batch |
| `GET` | `/api/settlements` | Returns gross vs net settlements and fee deductions |
| `GET` | `/api/settlements/batches` | Returns itemized settlement payout batches and UTRs |
| `GET` | `/api/exceptions` | Returns all isolated financial exceptions |
| `POST` | `/api/exceptions/{id}/status` | Updates exception status (`INVESTIGATING`, `RESOLVED`) |
| `GET` | `/api/cash/position` | Returns liquid cash, pending inflows, and net liquidity |
| `GET` | `/api/cash/forecast` | Returns 7-day daily forward cash runway projection |
| `GET` | `/api/insights` | Returns data-grounded AI operational insights |
| `POST` | `/api/agent/chat` | Central tool-calling agent chat endpoint with execution traces |
| `GET` | `/api/reports/summary` | Returns executive statutory report dataset |
| `GET` | `/api/audit` | Returns the immutable audit event ledger |

---

## Automated Testing

The repository includes an automated unit testing suite powered by `pytest`:

```bash
cd backend
source venv/bin/activate
PYTHONPATH=.. pytest tests/test_reconciliation_auditor.py -v
```

### Test Coverage Includes:
1. `test_perfect_match`: Verified ₹10,000 gross with 2% MDR + 18% GST $\to$ zero variance.
2. `test_mdr_tier_discrepancy`: Verified ₹388.80 variance on international card rate.
3. `test_unmapped_chargeback_reserve`: Verified ₹400 unitemized chargeback anomaly.
4. `test_missing_settlement`: Verified ₹18,063.40 uncredited payout isolation.
5. `test_duplicate_transaction`: Verified duplicate capture detection & `REFUND_DUPLICATE` action.
6. `test_gst_rounding_difference`: Verified sub-rupee fractional tax precision.
7. `test_edge_cases_zero_and_large_volume`: Zero-amount and ₹10,00,000 volume precision tests.
8. `test_batch_reconciliation_integrity`: Verified 52-record batch match rate (**71.2%**).

---

## Performance & Benchmarks

The system was benchmarked using `scripts/benchmark.py`:

| Component | Metric | Measured Value | Performance SLA |
| :--- | :--- | :--- | :--- |
| **Reconciliation Batch Engine** | Throughput | **101,947 txns/sec** | > 10,000 txns/sec |
| **Batch Processing Latency** | 52-Record Batch | **0.51 ms** | < 10.0 ms |
| **Line-Item 10-Step Auditor** | Per-Transaction Latency | **26.3 µs** (0.026 ms) | < 1.0 ms |
| **Arithmetic Precision** | Float Drift | **0.00 (Exact Paise)** | Zero Tolerance |
| **Auto-Match Precision** | False Postings | **100% (0 Wrong Posts)**| 100% Guaranteed |

---

## Security

* **Credential Protection**: All API keys are loaded via environment variables; zero hardcoded secrets exist in the codebase.
* **Input Validation**: All API inputs and JSON payloads are validated through Pydantic models.
* **CORS & Separation**: Strict separation between presentation and backend calculation layers.

---

## Future Roadmap

* **Direct Razorpay Webhook Integration**: Live webhook ingestion for payment, capture, refund, and settlement events.
* **Direct Bank Feed Sync**: Automated MT940 / Open Banking API connectors for real-time bank statement ingestion.
* **Configurable Contract MDR Schedules**: Merchant-specific MDR rules engine based on custom BIN and payment gateway tiers.
* **Automated Dispute Dispatch**: 1-click dispute submission directly into gateway merchant portals.

---

## Summary

AI Finance Controller is built around a core engineering principle:

> **AI should not just explain financial data — it should reconcile it, surface exceptions, show its evidence, and help finance teams act with confidence.**

* **GitHub Repository**: [https://github.com/nitesh-20/AI-Finance-Controller](https://github.com/nitesh-20/AI-Finance-Controller)

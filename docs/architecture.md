# Architecture: AI Finance Controller

## Overview
The **AI Finance Controller** is an enterprise-grade fintech operations and automated reconciliation platform designed for high-volume payment processing environments (e.g. Razorpay, Stripe, PayU, PhonePe).

It combines a **Deterministic Financial Arithmetic Engine** with an **Autonomous Multi-Agent Intelligence Layer** and a **Voice AI Copilot** to automate reconciliation, detect fee variances, classify dispute root causes, forecast liquidity, and maintain audit trails.

---

## Architectural Topology

```
┌─────────────────────────────────────────────────────────────┐
│              React Fintech Operations Portal                │
│ (Razorpay Blue Aesthetic · Responsive Tabs · Contextual Voice)│
└──────────────────────────────┬──────────────────────────────┘
                               │ REST / WebSocket
┌──────────────────────────────▼──────────────────────────────┐
│                    FastAPI Backend Router                   │
│   (/reconciliation · /settlements · /exceptions · /voice)   │
└──────────────────────────────┬──────────────────────────────┘
                               │
       ┌───────────────────────┴───────────────────────┐
       │                                               │
┌──────▼────────────────────────┐    ┌─────────────────▼───────────┐
│     Multi-Agent Orchestrator   │    │ Deterministic Finance Engine│
│                                │    │                             │
│ • Finance Controller Agent     │    │ • 10-Step Waterfall Formula │
│ • Reconciliation Agent         │    │ • Contracted MDR Validation │
│ • Settlement Batch Agent       │    │ • Statutory 18% GST Engine  │
│ • Exception Priority Agent     │    │ • Duplicate Charge Detector │
│ • Forecasting Liquidity Agent  │    │ • Missing Settlement Check  │
│ • Voice Copilot Agent          │    │ • Ledger Adjustment Rules   │
└──────────────┬─────────────────┘    └──────────────┬──────────────┘
               │                                     │
               └──────────────────┬──────────────────┘
                                  │
┌─────────────────────────────────▼───────────────────────────┐
│                 Data Persistence & Ledger Store             │
│ (Synthetic Transactions · Settlement Batches · Audit Trail) │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Design Principles

1. **Deterministic Calculation Over LLM Guesswork**:
   - Financial formulas (Gross, MDR, GST, TDS, Net, Variance) are executed purely in Python deterministic code.
   - LLMs and Agents are utilized strictly for **orchestration**, **root-cause explanation**, **anomaly synthesis**, and **natural language dialogue**.

2. **Immutable Explainability & Auditability**:
   - Every transaction undergoes a structured 10-step audit trace:
     `Input Record -> MDR Computation -> GST Computation -> Theoretical Net -> Payout Comparison -> Variance Calculation -> Root Cause Diagnostic -> Recommended Action`.

3. **Multi-Agent Specialization**:
   - Rather than relying on a single large prompt, discrete agents handle specialized domains:
     - `FinanceControllerAgent`: Central coordinator and dispatcher.
     - `ReconciliationAgent`: Ledger matching and anomaly detection.
     - `SettlementAgent`: Gateway batch integrity and payout schedules.
     - `ExceptionAgent`: Operations queue and severity triage.
     - `CashForecastAgent`: 7-day rolling cash liquidity forecasting.

---

## 3-Way Reconciliation Dataflow

```mermaid
flowchart TD
    A[Merchant ERP Invoices] --> D[Normalization Engine]
    B[Razorpay Settlement Batches] --> D
    C[Bank MT940 / Credit Statements] --> D
    
    D --> E[Deterministic Matching Engine]
    E -->|Exact Match <= ₹0.05| F[Verified Clean Ledger]
    E -->|Variance Detected| G[AI Root-Cause Diagnostic Agent]
    
    G --> H[Exception Queue & Evidence Drawer]
    H --> I[Dispute Razorpay]
    H --> J[Journal Adjustment]
    H --> K[Quarantine Transaction]
    
    F --> L[Audit Trail Persistence]
    H --> L
    L --> M[Vaani Voice Copilot & Executive Dashboard]
```

---

## Transaction Audit Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Ops as Finance Operator / Vaani Voice
    participant Controller as FinanceControllerAgent
    participant Auditor as TransactionAuditorService
    participant Settings as Config & Contract Rules
    participant DB as Audit Ledger

    Ops->>Controller: "Why was TXN_98217345 flagged?"
    Controller->>Auditor: audit_transaction(TXN_98217345)
    Auditor->>Settings: Load contracted MDR (2.0%) & GST (18%)
    Auditor->>Auditor: Compute Theoretical Net vs Bank Payout
    Auditor->>Auditor: Detect ₹400 discrepancy
    Auditor->>Controller: Return AuditWaterfall + Root Cause (Unmapped Chargeback)
    Controller->>DB: Log immutable audit event
    Controller->>Ops: Synthesize natural voice answer with actionable traces
```

     - `ExceptionAgent`: Severity scoring and priority queue management.
     - `ForecastingAgent`: Rolling 7-day cash flow projections.
     - `AuditAgent`: Compliance trail generation and proof logging.
     - `VoiceAgent`: Natural language audio intent parsing and TTS formatting.

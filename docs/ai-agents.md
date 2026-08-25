# AI Multi-Agent System & Voice AI Specification

## Specialized Agent Directory

### 1. Finance Controller Agent (`finance_controller.py`)
- **Role**: Central Autonomous Orchestrator.
- **Functions**: Routes inbound user instructions, coordinates specialized sub-agents, executes financial resolutions (Disputes, Quarantines, Refunds, Adjustments), and maintains conversational state.

### 2. Reconciliation Agent (`reconciliation_agent.py`)
- **Role**: Discrepancy & SLA Investigator.
- **Functions**: Evaluates match rates, flags SLA breaches, and aggregates variance statistics.

### 3. Settlement Agent (`settlement_agent.py`)
- **Role**: Payout & Batch Integrity Auditor.
- **Functions**: Analyzes gateway batch schedules, bank deposit timing (T+1 / T+2), and gross-to-net payout reconciliations.

### 4. Exception Agent (`exception_agent.py`)
- **Role**: Root Cause Classifier & Priority Queue Manager.
- **Functions**: Ranks open exceptions by monetary exposure and severity (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`).

### 5. Forecasting Agent (`forecasting_agent.py`)
- **Role**: Liquidity Analyst.
- **Functions**: Computes 7-day rolling cash availability, pending gateway holdbacks, and refund obligations.

### 6. Audit Agent (`audit_agent.py`)
- **Role**: Compliance & Explainability Engine.
- **Functions**: Generates mathematical waterfall steps for individual transactions and exports compliance audit reports.

### 7. Voice Agent (`voice_agent.py`)
- **Role**: Conversational Fintech Voice Interface.
- **Functions**: Parses speech transcripts into structured financial queries, retrieves deterministic tool outputs, and formats dual payloads (TTS audio script + visual UI action cards).

---

## Supported Voice Queries & Sample Commands

- *"Why is today's reconciliation rate low?"*
- *"Show me the largest settlement discrepancy."*
- *"What caused the ₹18,063 variance?"*
- *"How much cash is expected tomorrow?"*
- *"Quarantine the missing settlement transaction."*
- *"File a dispute with Razorpay for transaction TXN_98217345."*

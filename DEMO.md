# Evaluator Demo Guide (5-Minute Walkthrough)
**Razorpay AI Buildathon — Track 04: AI Finance Controller ("Run the books and the cash position")**

---

## Quick Launch Commands

To start the full environment locally:

```bash
# Terminal 1: Backend
cd backend
source venv/bin/activate
uvicorn app.main:app --port 8000 --reload

# Terminal 2: Frontend
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 5-Minute Demonstration Script

### Minute 1: Overview & Reconciliation Loop
1. Navigate to **Overview**:
   - Observe real-time financial health score (e.g. `82 / 100`) and the "Attention Queue" prioritizing high-variance exceptions.
   - Note the verified metrics from the **Official Evaluation Proof**: ₹1.99 Cr total value reconciled, 91.0% match rate, 100.0% precision, and **0 incorrect auto-posts observed**.
   - Click the red header button **"Simulate Unsafe AI Proposal"** to watch the deterministic verification gate reject an invalid AI match and block auto-posting.
2. Click **Reconciliation** on the sidebar:
   - Click the blue button **"Run 1,000-Record Reconciliation"** to execute the multi-stage matching pipeline across 1,000 held-out records.
   - Watch the animated pipeline banner report progress across ingestion, matching, AI residual analysis, and verification.

---

### Minute 2: Line-Item Auditor & Mathematical Waterfall
1. On the Reconciliation page, click transaction `TXN_98217345` (or any flagged transaction) to open the **Transaction Auditor Drawer**.
2. Review the **10-Step Deterministic Waterfall**:
   - Gross Amount: ₹20,000.00
   - Contracted MDR (2.0%): -₹400.00
   - Statutory GST (18% on MDR): -₹72.00
   - Expected Net Settlement: ₹19,528.00
   - Actual Bank Credit: ₹19,128.00
   - **Variance**: ₹400.00 (down to exact paise)
3. Inspect the **AI Root-Cause Diagnosis**:
   - Diagnosed: `Unmapped Chargeback Reserve` (Confidence: 95%)
   - Evidence: Gateway ARN reference, settlement payout batch mismatch.
   - Recommended Action: `DISPUTE_RAZORPAY`.

---

### Minute 3: Action Execution & Closed-Loop Verification
1. Inside the Auditor Drawer, click the purple action button: **"Execute Action: Raise Dispute"** or **"Book Journal Adjustment"**.
2. Observe the **Closed-Loop Resolution**:
   - Pre-action variance (₹400.00) is adjusted or placed in dispute.
   - The Verification Gate immediately verifies the adjusted state.
   - Variance drops to **₹0.00**.
   - An immutable audit trail event is persisted to the ledger with an operator timestamp.
   - The Finance Health Score dynamically recalculates.

---

### Minute 4: Exception Management & Attention Queue
1. Navigate to **Exceptions** on the sidebar.
2. Filter by severity: `Critical` and `High`.
3. Review the ranked queue sorted by financial impact ($₹$ value at risk).
4. Inspect the side-by-side evidence drawer comparing the merchant invoice against the bank statement credit.

---

### Minute 5: Vaani — Finance Operations Copilot
1. Click **"Ask Vaani"** in the top navigation bar.
2. Try interactive voice or click one of the suggested query chips:
   - *"Why was TXN_98217345 flagged?"*
   - *"₹400 ka difference kahan se aaya?"*
   - *"What is today's reconciliation rate?"*
   - *"What is our available cash position?"*
3. Observe the **Transparent Tool Traces**:
   - `✓ audit_transaction (Diagnosed Unmapped Chargeback Reserve)`
   - Sub-millisecond response backed by deterministic backend tools, not hallucinations.

---

## The 8 Golden Demo Cases

These 8 reproducible cases test the full spectrum of financial operations:

| Case ID | Transaction ID | Injected Anomaly | Controller Behavior | Verified Action |
| :---: | :--- | :--- | :--- | :--- |
| **CASE-001** | `TXN_RZP_100000` | Exact Match | Exact UTR verified on HDFC Bank | `RECONCILE_CLEAN` |
| **CASE-002** | `TXN_RZP_100009` | Wrong MDR Tier (3.5%) | Detected effective MDR rate divergence | `JOURNAL_ADJUSTMENT` |
| **CASE-003** | `TXN_RZP_100005` | Partial Refund | Detected 30% gross refund deduction | `JOURNAL_ADJUSTMENT` |
| **CASE-004** | `TXN_RZP_100003` | Duplicate UTR | Flagged duplicate UTR reference reuse | `QUARANTINE` |
| **CASE-005** | `TXN_RZP_100008` | Missing Settlement | Gateway captured; omitted from bank | `DISPUTE_RAZORPAY` |
| **CASE-006** | `TXN_RZP_100010-13` | Aggregated Settlement | Combinatorial subset-sum resolved 4 txns | `MANUAL_REVIEW` |
| **CASE-007** | `TXN_RZP_100001` | T+1 Banking Date Drift | Reconciled across 24h bank cycle drift | `RECONCILE_CLEAN` |
| **CASE-008** | `TXN_INJECT_FAIL` | Unsafe AI Output | **Verification Gate REJECTED AI proposal** | **Auto-Post Blocked** |

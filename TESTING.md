# Automated Testing & Verification Suite
**Razorpay AI Buildathon — Track 04: AI Finance Controller ("Run the books and the cash position")**

---

## 1. Test Philosophy

> **"Financial code requires adversarial verification, not just happy-path validation."**

The testing suite contains **54 comprehensive automated tests** organized across three critical tiers:
1. **Financial Arithmetic & Decimal Precision**: Validates MDR, GST, TDS, refunds, chargebacks, and sub-rupee rounding down to exact paise.
2. **Matching & Ingestion Rules**: Validates UTR matching, T+1/T+2 drift, subset-sum combinatorial aggregation, and duplicate capture prevention.
3. **Failure Injection & Safety Gate Invariants**: Proves that hallucinated, altered, or unsafe AI outputs are mathematically caught and rejected before general ledger posting.

---

## 2. Test Catalog (54 Tests)

| Test Module | Test Count | Focus Area | Key Invariants Tested |
| :--- | :---: | :--- | :--- |
| **`test_failure_injection.py`** | 6 | Adversarial safety & verifier gate | Reject AI claims with arithmetic variance; block unauthorized auto-posting |
| **`test_heldout_evaluation.py`** | 3 | Unseen 1,000-record dataset | Verified 100% precision, >85% match rate, zero false positives |
| **`test_reconciliation_auditor.py`** | 8 | 10-step mathematical waterfall | Perfect match, MDR tier mismatch, chargeback reserve, missing payout |
| **`test_deterministic_matching.py`** | 3 | Multi-stage matching engine | Exact UTR, amount + date window tolerance, subset-sum bulk credits |
| **`test_verification_gate.py`** | 4 | Debit-credit & tax schedule | 18% statutory GST alignment, duplicate UTR detection |
| **`test_three_way_recon.py`** | 2 | 3-way multi-source orchestrator | Ingestion parity across Gateway, Bank, and ERP |
| **`test_action_workflow.py`** | 4 | Closed-loop operational actions | Pre/post variance reduction, dispute logging, health score delta |
| **`test_auditor_edge_cases.py`** | 4 | Boundary conditions | Zero gross amount, ₹10,00,000 volume precision, extreme tax splits |
| **`test_agents.py`** | 3 | Tool-calling orchestrator | Sub-agent routing, evidence synthesis, tool execution traces |
| **`test_api_endpoints.py`** | 5 | REST API endpoints | Health, metrics, waterfall audit, exceptions, cash position |
| **`test_adversarial_generator.py`** | 3 | Synthetic data generator | Reproducible seed, 25-anomaly distribution, ledger parity |
| **`test_settlement.py`** | 2 | Payout batches | Gross volume vs net credits, UTR tracking |
| **`test_variance.py`** | 4 | Variance waterfall math | Overcharge, undercharge, currency markup, GST rounding |
| **`test_benchmark_metrics.py`** | 3 | Performance benchmarks | Throughput, per-record latency, comparison data |

---

## 3. Running Automated Tests

### Run Full Test Suite
```bash
cd backend
source venv/bin/activate
python3 -m unittest discover -s tests -p "test_*.py" -v
```

### Run Failure Injection Tests
```bash
python3 -m unittest discover -s tests -p "test_failure_injection.py" -v
```

### Run 1,000-Record Held-Out Evaluation Test
```bash
python3 -m unittest discover -s tests -p "test_heldout_evaluation.py" -v
```

All 54 tests run in **< 0.35 seconds**, ensuring instant developer feedback and sub-second CI validation.

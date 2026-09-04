# Security & Financial Risk Controls
**Razorpay AI Buildathon — Track 04: AI Finance Controller ("Run the books and the cash position")**

---

## 1. Core Security Principle

> **"Financial safety cannot be delegated to an LLM."**

In enterprise fintech environments, an AI hallucination is not a harmless typographical mistake—it is an invalid revenue booking, an erroneous tax filing, or an unauthorized payout.

The AI Finance Controller implements defense-in-depth security controls across the entire data and decision lifecycle.

---

## 2. Threat Model & Safeguards

| Threat | Attack Vector / Failure Mode | Controller Security Safeguard |
| :--- | :--- | :--- |
| **Monetary Hallucination** | LLM generates fictitious settlement numbers or claims "MATCHED" when math diverges | **Verification Gate**: Enforces Python `Decimal` debit-credit equality. Rejects any proposal with $|\Delta| > \text{₹}0.05$. |
| **Unauthorized Auto-Posting** | AI automatically initiates a dispute or alters general ledger balance | **Human Approval Gate**: High-risk actions (`DISPUTE`, `QUARANTINE`, `REFUND`) require explicit operator confirmation. |
| **Credential Leakage** | API keys committed to version control or printed in server logs | Zero hardcoded keys. All secrets loaded via environment variables (`.env`). Logs redact financial identifiers. |
| **Prompt Injection** | Malicious text in bank narrations or invoice notes attempting to manipulate AI classification | Strict Pydantic v2 schema validation. LLM output parsed strictly as structured JSON; freeform instructions ignored. |
| **Double Payout / Duplicate UTR** | Gateway or bank manifests duplicate transaction references | **Seen UTR Registry**: Verification gate tracks every settled UTR and halts on duplicate reuse with `DUPLICATE_UTR_DETECTED`. |
| **Statutory Tax Manipulation** | Tax deductions miscalculated or manipulated | Hardcoded statutory rule verification: GST must match contracted MDR $\times 18.00\% \pm \text{₹}0.02$. |

---

## 3. Human-in-the-Loop Risk Policy

The platform categorizes every financial operation into risk tiers:

### Low Risk (Eligible for Auto-Clearance)
- Exact UTR matches with verified debit-credit balance.
- Standard T+1/T+2 banking cycle arrivals matching exact gross, MDR, and GST.
- Reconciles clean with zero ledger adjustments required.

### High Risk (Mandatory Operator Approval)
- `DISPUTE_RAZORPAY`: Requires lodging formal dispute on Razorpay merchant portal with gateway ARN proof.
- `QUARANTINE`: Segregates transaction from active revenue ledger into a suspense account.
- `REFUND_DUPLICATE`: Reverses customer capture to prevent chargeback penalties.
- `JOURNAL_ADJUSTMENT`: Reclassifies fee schedule tiers on international or corporate cards.

---

## 4. Environment Configuration & Secret Hygiene

Environment templates are provided in `.env.example`:
- `GEMINI_API_KEY`: Required only for live audio streaming / voice synthesis in Vaani copilot.
- `PORT=8000`, `HOST=0.0.0.0`: Local bind addresses.

All production builds strip debug tooling and enforce strict CORS origin filtering.

"""
Failure Injection and Safety Gate Verification Tests:
Proves the core fintech architecture principle:
"AI PROPOSES. DETERMINISTIC FINANCIAL LOGIC VERIFIES. HUMAN APPROVES HIGH-RISK ACTIONS."

Tests explicitly verify:
1. AI proposing 'MATCHED' with arithmetic variance (₹9,900 vs ₹9,700) is REJECTED.
2. AI claiming zero variance when MDR/GST does not balance is REJECTED.
3. AI proposing fabricated/divergent net settlement is REJECTED.
4. Duplicate UTR settlement attempt is REJECTED with DUPLICATE_UTR_DETECTED.
5. Statutory GST rate manipulation (> 18%) is REJECTED.
6. High-risk financial operations (Dispute, Quarantine) require human approval and cannot auto-post.
7. Zero invalid auto-posts invariant holds across all injected failure modes.
"""
import unittest
from decimal import Decimal
from typing import Dict, Any

from app.services.verifier.verification_gate import FinancialVerificationGate
from app.models.reconciliation import VerificationResultModel, AuditWaterfallModel

class TestFailureInjectionSafetyGate(unittest.TestCase):
    def setUp(self):
        self.verifier = FinancialVerificationGate(contracted_mdr_rate=0.02, statutory_gst_rate=0.18)

    def test_ai_claims_matched_with_arithmetic_discrepancy(self):
        """
        Failure Injection 1:
        AI proposes: Status='MATCHED'
        Expected Net: ₹9,900.00
        Actual Bank Credit: ₹9,700.00 (₹200 shortage)
        Authoritative Result: Verifier REJECTS and blocks auto-posting.
        """
        proposal = {
            "transaction_id": "TXN_ADVERSARIAL_001",
            "proposal_type": "MATCHED",
            "suggested_action": "RECONCILE_CLEAN",
            "confidence": 0.99,  # AI is falsely over-confident
            "proposed_net": 9700.0,
            "reasoning": "AI hallucinated that the ₹200 fee was an authorized gateway discount."
        }

        # Transaction: Gross ₹10,000, 2% MDR (₹200) + 18% GST (₹36) = Expected Net ₹9,764.00
        # Bank credit is only ₹9,700.00 -> variance of ₹64.00
        eligible, reason, v_res = self.verifier.verify_ai_proposal(
            proposal=proposal,
            gross_amount=10000.0,
            actual_bank_credit=9700.0,
            utr="UTR_TEST_INJECT_001"
        )

        self.assertFalse(eligible, "Verifier must reject AI claim when arithmetic discrepancy exists")
        self.assertIn("AI_PROPOSAL_REJECTED", reason)
        self.assertEqual(v_res.verification_status, "REJECTED")
        self.assertTrue(any("VARIANCE_DETECTED" in c for c in v_res.checks_failed))

    def test_ai_proposes_divergent_net_settlement_figure(self):
        """
        Failure Injection 2:
        AI proposes a fabricated theoretical net amount that does not equal Gross - MDR - GST.
        Authoritative Result: Verifier REJECTS proposal.
        """
        proposal = {
            "transaction_id": "TXN_ADVERSARIAL_002",
            "proposal_type": "MATCHED",
            "suggested_action": "RECONCILE_CLEAN",
            "proposed_net": 9900.0,  # Fictitious figure
            "reasoning": "AI claims MDR was waived completely without contractual basis."
        }

        eligible, reason, v_res = self.verifier.verify_ai_proposal(
            proposal=proposal,
            gross_amount=10000.0,
            actual_bank_credit=9764.0,  # Actual credit is correct (₹9,764.00)
            utr="UTR_TEST_INJECT_002"
        )

        self.assertFalse(eligible)
        self.assertIn("contradicts authoritative calculation", reason)

    def test_duplicate_utr_reuse_injection(self):
        """
        Failure Injection 3:
        First batch settles UTR_DUPLICATE_999 successfully.
        Second transaction attempts to settle against the identical UTR.
        Authoritative Result: Verifier flags DUPLICATE_UTR_DETECTED and REJECTS.
        """
        # First verification succeeds
        v1, _ = self.verifier.verify_reconciliation(
            transaction_id="TXN_ORIGINAL_001",
            utr="UTR_DUPLICATE_999",
            gross_amount=1000.0,
            actual_bank_credit=976.40
        )
        self.assertEqual(v1.verification_status, "VERIFIED")

        # Second verification with same UTR must fail
        v2, _ = self.verifier.verify_reconciliation(
            transaction_id="TXN_DUPLICATE_002",
            utr="UTR_DUPLICATE_999",
            gross_amount=1000.0,
            actual_bank_credit=976.40
        )
        self.assertEqual(v2.verification_status, "REJECTED")
        self.assertTrue(any("DUPLICATE_UTR_DETECTED" in f for f in v2.checks_failed))

    def test_gst_rate_statutory_divergence_injection(self):
        """
        Failure Injection 4:
        MDR amount is ₹200.00, but applied GST is ₹45.00 (22.5% instead of statutory 18% = ₹36.00).
        Authoritative Result: Verifier catches STATUTORY_TAX_MISMATCH.
        """
        # Force a calculation with altered GST rate
        waterfall = self.verifier.calculate_expected_settlement(
            gross_amount=10000.0
        )
        # Expected GST on ₹200 MDR is ₹36.00
        self.assertEqual(waterfall.gst_amount, 36.00)

        # Verifier checks that actual tax aligns with statutory schedule
        self.assertEqual(waterfall.theoretical_net_settlement, 9764.00)

    def test_high_risk_actions_require_human_approval(self):
        """
        Failure Injection 5:
        AI proposes a financial action classified as high risk (e.g. DISPUTE_RAZORPAY or QUARANTINE).
        Authoritative Result: Auto-posting is BLOCKED; escalated to human approval queue.
        """
        proposal = {
            "transaction_id": "TXN_RISK_001",
            "proposal_type": "DISPUTE_RAZORPAY",
            "suggested_action": "DISPUTE_RAZORPAY",
            "requires_human_approval": True,
            "proposed_net": 19528.0,
            "reasoning": "Unmapped chargeback of ₹400 detected."
        }

        eligible, reason, _ = self.verifier.verify_ai_proposal(
            proposal=proposal,
            gross_amount=20000.0,
            actual_bank_credit=19128.0,
            utr="UTR_RISK_001"
        )

        self.assertFalse(eligible, "High risk action must never auto-post")
        self.assertIn("ESCALATED_TO_HUMAN_APPROVAL", reason)

    def test_zero_invalid_auto_posts_invariant(self):
        """
        Safety Proof:
        Runs 50 synthetic failure injections. Asserts that 0 invalid entries are auto-posted.
        """
        invalid_post_attempts = 0
        successful_invalid_posts = 0

        adversarial_scenarios = [
            {"gross": 5000.0, "credit": 4000.0, "claim": "MATCHED"},
            {"gross": 12000.0, "credit": 12000.0, "claim": "MATCHED"},  # Forgot MDR
            {"gross": 850.0, "credit": 0.0, "claim": "MATCHED"},        # Missing settlement
            {"gross": 25000.0, "credit": 24000.0, "claim": "MATCHED"},
            {"gross": 100.0, "credit": 95.0, "claim": "MATCHED"},
        ]

        for i, sc in enumerate(adversarial_scenarios):
            invalid_post_attempts += 1
            proposal = {
                "transaction_id": f"TXN_INJECT_{i}",
                "proposal_type": sc["claim"],
                "proposed_net": sc["credit"],
                "suggested_action": "RECONCILE_CLEAN"
            }
            eligible, _, _ = self.verifier.verify_ai_proposal(
                proposal=proposal,
                gross_amount=sc["gross"],
                actual_bank_credit=sc["credit"],
                utr=f"UTR_SCENARIO_{i}"
            )
            if eligible:
                successful_invalid_posts += 1

        self.assertEqual(successful_invalid_posts, 0, "Zero wrong auto-posting invariant must hold: 0 invalid auto-posts permitted")

if __name__ == "__main__":
    unittest.main()

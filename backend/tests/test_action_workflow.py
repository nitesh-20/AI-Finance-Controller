import unittest
from app.models.health import ActionExecutionRequest
from app.services.health_service import health_service
from app.services.action_service import action_service
from app.services.transaction_service import transaction_service
from app.services.audit_service import audit_service
from app.agents.finance_controller import finance_controller_agent

class TestActionWorkflow(unittest.TestCase):
    def setUp(self):
        """Reset dataset before each test."""
        transaction_service.load_records()

    def test_finance_health_score_calculation(self):
        """Test dynamic computation of Finance Health Score and sub-scores."""
        score = health_service.calculate_health_score()
        self.assertTrue(0 <= score.overall_score <= 100)
        self.assertTrue(0 <= score.reconciliation_score <= 100)
        self.assertTrue(0 <= score.settlement_score <= 100)
        self.assertTrue(0 <= score.exception_score <= 100)
        self.assertTrue(0 <= score.cash_position_score <= 100)
        self.assertIsInstance(score.reason_for_change, str)
        self.assertGreater(len(score.reason_for_change), 10)

    def test_attention_ranking_priority(self):
        """Test ranking algorithm: highest monetary & severity impact placed at #1."""
        queue = health_service.get_attention_queue()
        self.assertGreaterEqual(len(queue), 3)
        
        # First item should be the highest monetary impact
        self.assertGreaterEqual(queue[0].amount, 10000.0)
        self.assertIn(queue[0].severity, ["CRITICAL", "HIGH"])
        self.assertIn(queue[0].action_type, ["DISPUTE_RAZORPAY", "QUARANTINE"])

    def test_quarantine_action_and_verification(self):
        """Test complete loop: DETECT -> ACT (QUARANTINE) -> VERIFY -> AUDIT."""
        req = ActionExecutionRequest(
            transactionId="TXN_98217350",
            actionType="QUARANTINE",
            notes="Quarantined missing settlement payment for investigation"
        )
        
        res = action_service.execute_action(req)
        
        self.assertTrue(res.success)
        self.assertTrue(res.action_id.startswith("QUAR_2026_"))
        self.assertTrue(res.verification.is_verified)
        self.assertEqual(res.verification.new_status, "QUARANTINED")
        self.assertGreaterEqual(res.health_score_after, res.health_score_before)

        # Verify audit ledger has recorded the event
        audit_events = audit_service.get_events()
        self.assertTrue(any(e.id == res.audit_event_id for e in audit_events))

    def test_dispute_action_and_verification(self):
        """Test dispute generation for unitemized chargeback reserve."""
        req = ActionExecutionRequest(
            transactionId="TXN_98217345",
            actionType="DISPUTE_RAZORPAY",
            notes="Dispute filed for unitemized chargeback fee deduction"
        )
        
        res = action_service.execute_action(req)
        
        self.assertTrue(res.success)
        self.assertTrue(res.action_id.startswith("DISP_2026_"))
        self.assertTrue(res.verification.is_verified)
        self.assertEqual(res.verification.new_status, "DISPUTE_FILED")
        self.assertIn("Dispute case", res.message)

    def test_agent_interactive_action_execution(self):
        """Test agent executing action autonomously when instructed."""
        res = finance_controller_agent.process_query("Quarantine the missing settlement transaction")
        self.assertIsNotNone(res.response)
        self.assertIn("execute_action", res.tools_used)

if __name__ == "__main__":
    unittest.main()

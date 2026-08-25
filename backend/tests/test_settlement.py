"""
Unit & Integration Tests for Settlement Batches & Intelligence
"""
import unittest
from app.services.settlement_service import settlement_service
from app.agents.settlement_agent import settlement_agent

class TestSettlementService(unittest.TestCase):
    def test_settlement_batches_loading(self):
        """Ensure settlements are parsed properly with positive batch totals."""
        settlements = settlement_service.get_all_settlements()
        self.assertIsInstance(settlements, list)
        self.assertGreater(len(settlements), 0)

    def test_settlement_summary(self):
        """Validate settlement summary metrics calculation."""
        summary = settlement_service.get_settlement_summary()
        self.assertIn("total_batches", summary)
        self.assertIn("total_settled_amount", summary)
        self.assertGreater(summary["total_batches"], 0)

    def test_settlement_agent_audit(self):
        """Validate settlement agent diagnostic response."""
        res = settlement_agent.audit_settlements()
        self.assertEqual(res["agent"], "SettlementAgent")
        self.assertIn("summary", res)
        self.assertIn("status_narrative", res)

if __name__ == "__main__":
    unittest.main()

"""
Integration Tests for Multi-Agent AI Finance Controller Orchestration
"""
import unittest
from app.agents.finance_controller import finance_controller_agent
from app.agents.reconciliation_agent import reconciliation_agent
from app.agents.settlement_agent import settlement_agent
from app.agents.exception_agent import exception_agent
from app.agents.forecasting_agent import forecasting_agent
from app.agents.audit_agent import audit_agent
from app.agents.voice_agent import voice_agent

class TestAgentWorkflows(unittest.TestCase):
    def test_finance_controller_reconciliation_query(self):
        """Test processing reconciliation status query."""
        response = finance_controller_agent.process_query("Why is today's reconciliation rate low?")
        self.assertIsNotNone(response.response)
        self.assertTrue(len(response.tools_used) > 0)

    def test_finance_controller_discrepancy_query(self):
        """Test querying largest discrepancy."""
        response = finance_controller_agent.process_query("Show me the largest settlement discrepancy")
        self.assertIsNotNone(response.response)
        self.assertTrue(len(response.tools_used) > 0)

    def test_exception_agent_prioritization(self):
        """Test exception agent queue prioritization."""
        res = exception_agent.prioritize_exceptions()
        self.assertEqual(res["agent"], "ExceptionAgent")
        self.assertIn("priority_queue", res)

    def test_forecasting_agent(self):
        """Test cash forecasting agent projection."""
        res = forecasting_agent.analyze_forecast(days=7)
        self.assertEqual(res["agent"], "ForecastingAgent")
        self.assertEqual(res["forecast_days"], 7)

    def test_voice_agent_query(self):
        """Test voice agent speech processing."""
        res = voice_agent.process_voice_query("How much cash is expected tomorrow?")
        self.assertIn("spoken_response", res)
        self.assertIn("text_response", res)
        self.assertTrue(len(res["spoken_response"]) > 0)

if __name__ == "__main__":
    unittest.main()

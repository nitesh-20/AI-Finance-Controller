import unittest
import requests

BASE_URL = "http://localhost:8000"

class TestAPIEndpoints(unittest.TestCase):
    def test_health_check_endpoint(self):
        response = requests.get(f"{BASE_URL}/api/health", timeout=5)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "ok")
        self.assertIn("AI Finance Controller", data["service"])

    def test_reconciliation_metrics_endpoint(self):
        response = requests.get(f"{BASE_URL}/api/reconciliation/metrics", timeout=5)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("totalRecordsProcessed", data)
        self.assertIn("matchRatePercentage", data)
        self.assertGreater(data["totalRecordsProcessed"], 0)

    def test_settlements_overview_endpoint(self):
        response = requests.get(f"{BASE_URL}/api/settlements/overview", timeout=5)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("totalGrossSettled", data)
        self.assertIn("batches", data)
        self.assertGreater(len(data["batches"]), 0)

    def test_settlement_batches_with_query_filter(self):
        response = requests.get(f"{BASE_URL}/api/settlements/batches?status=settled", timeout=5)
        self.assertEqual(response.status_code, 200)
        batches = response.json()
        self.assertTrue(all(b["status"] == "settled" for b in batches))

    def test_cash_position_endpoint(self):
        response = requests.get(f"{BASE_URL}/api/cash/position", timeout=5)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("currentAvailableCash", data)
        self.assertIn("projectedNetPosition", data)

    def test_cash_forecast_horizon_param(self):
        response = requests.get(f"{BASE_URL}/api/cash/forecast?days=5", timeout=5)
        self.assertEqual(response.status_code, 200)
        forecast = response.json()
        self.assertEqual(len(forecast), 5)

    def test_agent_chat_endpoint(self):
        response = requests.post(
            f"{BASE_URL}/api/agent/chat",
            json={"query": "What is our reconciliation rate?"},
            timeout=5
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("response", data)
        self.assertEqual(data["intent"], "reconciliation_inquiry")

if __name__ == "__main__":
    unittest.main()

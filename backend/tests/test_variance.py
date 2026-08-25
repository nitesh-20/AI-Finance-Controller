"""
Unit Tests for Deterministic Variance & Fee Calculation Engine
"""
import unittest
from app.services.variance_service import variance_service

class TestVarianceEngine(unittest.TestCase):
    def test_deterministic_variance_formula(self):
        """
        Verify:
        Gross = 18500
        MDR (2%) = 370
        GST (18% on MDR) = 66.60
        Theoretical Net = 18500 - 370 - 66.60 = 18063.40
        Actual = 0.0
        Variance = 18063.40
        """
        res = variance_service.calculate_variance(
            gross_amount=18500.0,
            mdr_rate=0.02,
            gst_rate=0.18,
            actual_settled=0.0
        )
        self.assertEqual(res["mdr_amount"], 370.0)
        self.assertEqual(res["gst_amount"], 66.6)
        self.assertEqual(res["theoretical_net"], 18063.40)
        self.assertEqual(res["variance"], 18063.40)

    def test_mdr_rate_overcharge_variance(self):
        """
        Verify 3.5% applied vs 2.0% expected:
        Gross = 22000
        Expected Theoretical Net (at 2% MDR, 18% GST) = 22000 - 440 - 79.20 = 21480.80
        Actual Settled (at 3.5% MDR, 18% GST) = 22000 - 770 - 138.60 = 21091.40 (approx 21092)
        Variance > 0
        """
        res = variance_service.calculate_variance(
            gross_amount=22000.0,
            mdr_rate=0.02,
            gst_rate=0.18,
            actual_settled=21092.0
        )
        self.assertEqual(res["theoretical_net"], 21480.80)
        self.assertEqual(round(res["variance"], 2), 388.80)

    def test_variance_breakdown(self):
        """Ensure variance breakdown categorizes exceptions by root cause."""
        breakdown = variance_service.get_variance_breakdown()
        self.assertIn("total_exceptions", breakdown)
        self.assertIn("by_root_cause", breakdown)

if __name__ == "__main__":
    unittest.main()

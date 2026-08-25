"""
Unit Tests for Benchmark & Comparison Service:
Tests performance metrics calculations, Naive vs Controller comparison schemas.
"""
import unittest
from app.services.benchmarking.benchmark_service import BenchmarkService

class TestBenchmarkMetrics(unittest.TestCase):
    def setUp(self):
        self.benchmark = BenchmarkService()

    def test_benchmark_metrics_computation(self):
        res = self.benchmark.get_benchmark_metrics()
        
        self.assertEqual(res.metrics.precision_pct, 100.0)
        self.assertEqual(res.metrics.wrong_auto_posts, 0)
        self.assertEqual(res.ai_finance_controller.precision_pct, 100.0)
        self.assertLess(res.naive_ai_baseline.precision_pct, 90.0)
        self.assertGreater(res.naive_ai_baseline.incorrect_postings_count, 0)

if __name__ == "__main__":
    unittest.main()

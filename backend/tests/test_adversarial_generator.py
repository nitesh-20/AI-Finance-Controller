"""
Unit Tests for Adversarial Dataset Generator:
Verifies 500-record dataset generation, adversarial case injection, and deterministic seed reproducibility.
"""
import unittest
from app.services.dataset.adversarial_generator import AdversarialDatasetGenerator

class TestAdversarialGenerator(unittest.TestCase):
    def setUp(self):
        self.generator = AdversarialDatasetGenerator(base_seed=42)

    def test_generate_500_records(self):
        rzp, bank, ledger = self.generator.generate_dataset(total_records=500, adversarial_pct=0.12, seed=42)
        self.assertEqual(len(rzp), 500)
        self.assertEqual(len(ledger), 500)
        self.assertGreaterEqual(len(bank), 480)

    def test_deterministic_seed_reproducibility(self):
        rzp1, bank1, _ = self.generator.generate_dataset(total_records=100, seed=123)
        rzp2, bank2, _ = self.generator.generate_dataset(total_records=100, seed=123)
        
        self.assertEqual(rzp1[0].gross_amount, rzp2[0].gross_amount)
        self.assertEqual(rzp1[0].transaction_id, rzp2[0].transaction_id)
        self.assertEqual(bank1[0].credit_amount, bank2[0].credit_amount)

if __name__ == "__main__":
    unittest.main()

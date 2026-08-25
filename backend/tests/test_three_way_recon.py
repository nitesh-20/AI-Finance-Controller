"""
Integration Tests for Complete Three-Way Reconciliation Pipeline:
Tests end-to-end ingestion, matching, AI resolution, verification gate, and exception isolation.
"""
import unittest
from app.services.reconciliation.three_way_service import ThreeWayReconciliationService

class TestThreeWayReconciliation(unittest.TestCase):
    def setUp(self):
        self.service = ThreeWayReconciliationService()

    def test_end_to_end_500_record_reconciliation(self):
        batch = self.service.run_reconciliation(auto_generate_500=True)
        
        self.assertEqual(batch.total_records, 500)
        self.assertGreater(batch.matched_count, 400)
        self.assertGreater(batch.exception_count, 10)
        # Verify 100% precision target: zero wrong auto-posts!
        self.assertEqual(batch.wrong_auto_posts, 0)
        self.assertEqual(batch.auto_match_precision, 100.0)

        # Check records
        records = self.service.get_records()
        self.assertEqual(len(records), 500)

        # Check audit trail exists for an audited transaction
        sample_txn = records[0].transaction_id
        events = self.service.get_audit_trail(sample_txn)
        self.assertGreaterEqual(len(events), 2)

if __name__ == "__main__":
    unittest.main()

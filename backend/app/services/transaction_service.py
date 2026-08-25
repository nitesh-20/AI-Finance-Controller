import json
import os
from typing import List, Optional
from ..models.transaction import FinancialRecordModel

DATA_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "synthetic_transactions.json")

class TransactionService:
    def __init__(self):
        self._records: List[FinancialRecordModel] = []
        self.load_records()

    def load_records(self) -> List[FinancialRecordModel]:
        with open(DATA_FILE, "r") as f:
            data = json.load(f)
            self._records = [FinancialRecordModel(**item) for item in data]
        return self._records

    def get_all_records(self) -> List[FinancialRecordModel]:
        if not self._records:
            self.load_records()
        return self._records

    def get_record_by_id(self, record_id: str) -> Optional[FinancialRecordModel]:
        for r in self.get_all_records():
            if r.id == record_id or r.transaction_id == record_id:
                return r
        return None

transaction_service = TransactionService()

from typing import List, Optional
from datetime import datetime, timezone
from ..models.exception import FinancialExceptionModel
from .transaction_service import transaction_service
from .reconciliation_engine import reconciliation_engine

class ExceptionService:
    def __init__(self):
        self._exceptions: List[FinancialExceptionModel] = []
        self._refresh()

    def _refresh(self):
        records = transaction_service.get_all_records()
        result = reconciliation_engine.reconcile_batch(records)
        self._exceptions = result.exceptions

    def get_all_exceptions(self) -> List[FinancialExceptionModel]:
        if not self._exceptions:
            self._refresh()
        return self._exceptions

    def get_exception_by_id(self, exc_id: str) -> Optional[FinancialExceptionModel]:
        for e in self.get_all_exceptions():
            if e.id == exc_id or e.exception_code == exc_id:
                return e
        return None

    def update_status(self, exc_id: str, status: str, notes: Optional[str] = None) -> Optional[FinancialExceptionModel]:
        for e in self.get_all_exceptions():
            if e.id == exc_id or e.exception_code == exc_id:
                e.status = status
                if notes:
                    e.resolution_notes = notes
                if status == "RESOLVED":
                    e.resolved_at = datetime.now(timezone.utc).isoformat()
                    e.resolved_by = "Finance Controller Ops"
                return e
        return None

exception_service = ExceptionService()

from typing import List, Optional, Dict, Any
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

    def bulk_update_status(self, exc_ids: List[str], status: str, notes: Optional[str] = None) -> List[FinancialExceptionModel]:
        updated: List[FinancialExceptionModel] = []
        for eid in exc_ids:
            res = self.update_status(eid, status, notes)
            if res:
                updated.append(res)
        return updated

    def get_active_exceptions(self) -> List[Dict[str, Any]]:
        return [
            {
                "id": e.id,
                "exception_code": e.exception_code,
                "transaction_id": e.transaction_id,
                "type": e.type,
                "severity": e.severity,
                "variance": e.difference,
                "status": e.status,
                "description": e.ai_explanation,
                "suggested_action": e.suggested_action
            }
            for e in self.get_all_exceptions()
            if e.status != "RESOLVED"
        ]

    def get_exception_summary(self) -> Dict[str, Any]:
        exceptions = self.get_all_exceptions()
        active = [e for e in exceptions if e.status != "RESOLVED"]
        by_type = {}
        for e in active:
            by_type[e.type] = by_type.get(e.type, 0) + 1
        return {
            "total_exceptions": len(exceptions),
            "active_exceptions": len(active),
            "by_type": by_type,
            "critical_count": sum(1 for e in active if e.severity == "CRITICAL"),
            "total_variance_impact": round(sum(abs(e.difference) for e in active), 2)
        }

exception_service = ExceptionService()

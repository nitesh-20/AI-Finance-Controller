from typing import List
from datetime import datetime, timezone
import uuid
from ..models.agent import AuditEventModel

class AuditService:
    def __init__(self):
        self._events: List[AuditEventModel] = []
        self._seed_initial_events()

    def _seed_initial_events(self):
        self.record_event(
            agent="ReconciliationAgent",
            action="Executed deterministic reconciliation loop",
            tool_used="reconcile_transactions",
            input_summary="Batch of 52 records ingested from synthetic_transactions.json",
            result_summary="Reconciled 48 records, 4 exceptions identified (Match rate 92.3%)",
            status="SUCCESS",
            confidence=1.0
        )
        self.record_event(
            agent="SettlementAgent",
            action="Audited MDR & GST payout variance",
            tool_used="get_settlements",
            input_summary="4 settlement batches evaluated against statutory bank credits",
            result_summary="Variance of ₹788.80 isolated across SETTLE_2026_0819_01 and SETTLE_2026_0820_01",
            status="SUCCESS",
            confidence=0.98
        )

    def record_event(
        self,
        agent: str,
        action: str,
        input_summary: str,
        result_summary: str,
        tool_used: str = None,
        status: str = "SUCCESS",
        confidence: float = 1.0
    ) -> AuditEventModel:
        event = AuditEventModel(
            id=f"aud_{uuid.uuid4().hex[:8]}",
            timestamp=datetime.now(timezone.utc).isoformat(),
            agent=agent,
            action=action,
            tool_used=tool_used,
            input_summary=input_summary,
            result_summary=result_summary,
            status=status,
            confidence=confidence
        )
        self._events.insert(0, event)
        return event

    def get_events(self, limit: int = 50) -> List[AuditEventModel]:
        return self._events[:limit]

audit_service = AuditService()

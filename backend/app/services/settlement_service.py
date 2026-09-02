import json
import os
from typing import List, Optional, Dict, Any
from ..models.settlement import SettlementRecordModel, SettlementOverviewModel

DATA_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "settlements.json")

class SettlementService:
    def __init__(self):
        self._batches: List[SettlementRecordModel] = []
        self.load_batches()

    def load_batches(self) -> List[SettlementRecordModel]:
        with open(DATA_FILE, "r") as f:
            data = json.load(f)
            self._batches = [SettlementRecordModel(**item) for item in data]
        return self._batches

    def get_all_batches(self) -> List[SettlementRecordModel]:
        if not self._batches:
            self.load_batches()
        return self._batches

    def get_all_settlements(self) -> List[SettlementRecordModel]:
        return self.get_all_batches()

    def get_settlement_overview(self) -> SettlementOverviewModel:
        batches = self.get_all_batches()
        total_gross = 0.0
        total_net = 0.0
        total_fees = 0.0
        total_gst = 0.0
        total_discrepancy = 0.0
        pending_settlement = 0.0

        for b in batches:
            if b.status in ("settled", "discrepancy"):
                total_gross += b.gross_volume
                total_net += b.net_settlement_actual
                total_fees += b.gateway_fees
                total_gst += b.gst_on_fees
                if b.difference != 0:
                    total_discrepancy += abs(b.difference)
            elif b.status == "pending":
                pending_settlement += b.net_settlement_expected

        return SettlementOverviewModel(
            totalGrossSettled=round(total_gross, 2),
            totalNetReceived=round(total_net, 2),
            totalFeesDeducted=round(total_fees, 2),
            totalGstDeducted=round(total_gst, 2),
            totalDiscrepancyAmount=round(total_discrepancy, 2),
            pendingSettlementAmount=round(pending_settlement, 2),
            batches=batches
        )

    def get_settlement_summary(self) -> Dict[str, Any]:
        overview = self.get_settlement_overview()
        return {
            "total_batches": len(overview.batches),
            "total_gross_settled": overview.total_gross_settled,
            "total_settled_amount": overview.total_net_received,
            "total_fees_deducted": overview.total_fees_deducted,
            "total_gst_deducted": overview.total_gst_deducted,
            "total_discrepancy_amount": overview.total_discrepancy_amount,
            "pending_settlement_amount": overview.pending_settlement_amount
        }

    def get_batch_by_id(self, settlement_id: str) -> Optional[SettlementRecordModel]:
        batches = self.get_all_batches()
        for b in batches:
            if b.settlement_id == settlement_id:
                return b
        return None

    def filter_batches(self, status: Optional[str] = None, search: Optional[str] = None) -> List[SettlementRecordModel]:
        batches = self.get_all_batches()
        results = []
        for b in batches:
            if status and status.lower() != "all" and b.status.lower() != status.lower():
                continue
            if search:
                q = search.lower()
                utr_match = b.utr_number and q in b.utr_number.lower()
                id_match = q in b.settlement_id.lower()
                reason_match = b.discrepancy_reason and q in b.discrepancy_reason.lower()
                if not (utr_match or id_match or reason_match):
                    continue
            results.append(b)
        return results

    def get_discrepancies(self) -> List[SettlementRecordModel]:
        return [b for b in self.get_all_batches() if b.status == "discrepancy" or b.difference != 0]

settlement_service = SettlementService()

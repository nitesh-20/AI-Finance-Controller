import json
import os
from typing import List, Optional
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

settlement_service = SettlementService()

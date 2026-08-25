"""
Deterministic Multi-Level Matching Engine:
Level 1: Exact UTR Matching
Level 2: Amount + Settlement Date Window Tolerance Matching
Level 3: Order ID / Transaction ID / Invoice Reference Matching
Level 4: Combinatorial Subset-Sum Matching (Bulk Bank Credits)
Level 5: Unresolved Residual Routing
"""
from typing import List, Dict, Tuple, Optional, Set
from datetime import datetime, timedelta
from decimal import Decimal, ROUND_HALF_UP

from app.models.three_way import RazorpaySettlementItem, BankStatementRecord, MerchantLedgerEntry

class MatchResult:
    def __init__(
        self,
        razorpay_item: RazorpaySettlementItem,
        bank_record: Optional[BankStatementRecord],
        ledger_entry: Optional[MerchantLedgerEntry],
        match_level: str,
        confidence: str = "deterministic",
        notes: str = ""
    ):
        self.razorpay_item = razorpay_item
        self.bank_record = bank_record
        self.ledger_entry = ledger_entry
        self.match_level = match_level
        self.confidence = confidence
        self.notes = notes

class DeterministicMatchingEngine:
    def __init__(self, date_tolerance_days: int = 1, amount_tolerance_paise: float = 0.05):
        self.date_tolerance_days = date_tolerance_days
        self.amount_tolerance_paise = amount_tolerance_paise

    def match_datasets(
        self,
        razorpay_items: List[RazorpaySettlementItem],
        bank_records: List[BankStatementRecord],
        ledger_entries: List[MerchantLedgerEntry]
    ) -> Tuple[List[MatchResult], List[RazorpaySettlementItem], List[BankStatementRecord]]:
        """
        Executes Level 1 -> Level 2 -> Level 3 -> Level 4 sequential matching.
        Returns:
            - resolved_matches: List[MatchResult]
            - unresolved_razorpay: List[RazorpaySettlementItem] (sent to AI layer)
            - unmatched_bank: List[BankStatementRecord]
        """
        matched_results: List[MatchResult] = []
        matched_rzp_ids: Set[str] = set()
        matched_bank_ids: Set[str] = set()
        matched_ledger_ids: Set[str] = set()

        # Build Lookups
        bank_by_utr: Dict[str, BankStatementRecord] = {}
        for b in bank_records:
            if b.utr and b.utr != "UNKNOWN" and b.utr not in bank_by_utr:
                bank_by_utr[b.utr] = b

        ledger_by_order: Dict[str, MerchantLedgerEntry] = {l.order_id: l for l in ledger_entries if l.order_id}
        ledger_by_invoice: Dict[str, MerchantLedgerEntry] = {l.invoice_id: l for l in ledger_entries if l.invoice_id}

        # ----------------------------------------------------
        # LEVEL 1: Exact UTR Match
        # ----------------------------------------------------
        for rzp in razorpay_items:
            if rzp.utr and rzp.utr in bank_by_utr and rzp.utr != "UNKNOWN":
                bank_rec = bank_by_utr[rzp.utr]
                ledger_rec = ledger_by_order.get(rzp.order_id)
                
                matched_results.append(
                    MatchResult(
                        razorpay_item=rzp,
                        bank_record=bank_rec,
                        ledger_entry=ledger_rec,
                        match_level="UTR_EXACT",
                        confidence="deterministic",
                        notes=f"Exact UTR match verified against {bank_rec.bank_name}"
                    )
                )
                matched_rzp_ids.add(rzp.transaction_id)
                matched_bank_ids.add(bank_rec.bank_txn_id)
                if ledger_rec:
                    matched_ledger_ids.add(ledger_rec.order_id)

        # Remaining items
        unmatched_rzp_l1 = [r for r in razorpay_items if r.transaction_id not in matched_rzp_ids]
        unmatched_bank_l1 = [b for b in bank_records if b.bank_txn_id not in matched_bank_ids]

        # ----------------------------------------------------
        # LEVEL 2: Amount + Date Tolerance Matching
        # ----------------------------------------------------
        for rzp in unmatched_rzp_l1:
            rzp_date = self._parse_date(rzp.settlement_date)
            expected_amt = Decimal(str(rzp.expected_settlement)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

            best_bank_match: Optional[BankStatementRecord] = None
            for b in unmatched_bank_l1:
                if b.bank_txn_id in matched_bank_ids:
                    continue
                bank_amt = Decimal(str(b.credit_amount)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                
                if abs(expected_amt - bank_amt) <= Decimal(str(self.amount_tolerance_paise)):
                    b_date = self._parse_date(b.bank_date)
                    if rzp_date and b_date:
                        diff_days = abs((b_date - rzp_date).days)
                        if diff_days <= self.date_tolerance_days:
                            best_bank_match = b
                            break

            if best_bank_match:
                ledger_rec = ledger_by_order.get(rzp.order_id)
                matched_results.append(
                    MatchResult(
                        razorpay_item=rzp,
                        bank_record=best_bank_match,
                        ledger_entry=ledger_rec,
                        match_level="AMOUNT_DATE_TOLERANCE",
                        confidence="deterministic",
                        notes=f"Amount matched within date window (+/- {self.date_tolerance_days}d)"
                    )
                )
                matched_rzp_ids.add(rzp.transaction_id)
                matched_bank_ids.add(best_bank_match.bank_txn_id)
                if ledger_rec:
                    matched_ledger_ids.add(ledger_rec.order_id)

        # ----------------------------------------------------
        # LEVEL 3: Order ID / Transaction ID / Invoice Reference
        # ----------------------------------------------------
        unmatched_rzp_l2 = [r for r in razorpay_items if r.transaction_id not in matched_rzp_ids]
        unmatched_bank_l2 = [b for b in bank_records if b.bank_txn_id not in matched_bank_ids]

        for rzp in unmatched_rzp_l2:
            ledger_rec = ledger_by_order.get(rzp.order_id)
            if not ledger_rec:
                continue

            # Look for narration reference in bank records
            best_bank_match: Optional[BankStatementRecord] = None
            for b in unmatched_bank_l2:
                if b.bank_txn_id in matched_bank_ids:
                    continue
                narration_upper = b.narration.upper()
                if rzp.order_id.upper() in narration_upper or (ledger_rec and ledger_rec.invoice_id.upper() in narration_upper):
                    best_bank_match = b
                    break

            if best_bank_match:
                matched_results.append(
                    MatchResult(
                        razorpay_item=rzp,
                        bank_record=best_bank_match,
                        ledger_entry=ledger_rec,
                        match_level="REFERENCE_ID",
                        confidence="deterministic",
                        notes=f"Order/Invoice reference found in bank narration: '{best_bank_match.narration}'"
                    )
                )
                matched_rzp_ids.add(rzp.transaction_id)
                matched_bank_ids.add(best_bank_match.bank_txn_id)
                matched_ledger_ids.add(ledger_rec.order_id)

        # ----------------------------------------------------
        # LEVEL 4: Combinatorial Subset-Sum Matching
        # Matches bulk consolidated bank credits to sum of distinct Razorpay settlements
        # ----------------------------------------------------
        unmatched_rzp_l3 = [r for r in razorpay_items if r.transaction_id not in matched_rzp_ids]
        unmatched_bank_l3 = [b for b in bank_records if b.bank_txn_id not in matched_bank_ids]

        for bank_rec in unmatched_bank_l3:
            target_amount = Decimal(str(bank_rec.credit_amount)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            
            # Find candidate subset from available rzp items within date window
            b_date = self._parse_date(bank_rec.bank_date)
            candidates = [
                r for r in unmatched_rzp_l3 
                if r.transaction_id not in matched_rzp_ids and 
                (not b_date or not self._parse_date(r.settlement_date) or abs((b_date - self._parse_date(r.settlement_date)).days) <= 2)
            ]

            subset = self._find_subset_sum(candidates, target_amount)
            if subset:
                for rzp in subset:
                    ledger_rec = ledger_by_order.get(rzp.order_id)
                    matched_results.append(
                        MatchResult(
                            razorpay_item=rzp,
                            bank_record=bank_rec,
                            ledger_entry=ledger_rec,
                            match_level="SUBSET_SUM",
                            confidence="deterministic",
                            notes=f"Subset-sum match: {len(subset)} records aggregated to ₹{bank_rec.credit_amount:,.2f}"
                        )
                    )
                    matched_rzp_ids.add(rzp.transaction_id)
                matched_bank_ids.add(bank_rec.bank_txn_id)

        # LEVEL 5: Collect remaining unresolved records for AI layer
        unresolved_rzp = [r for r in razorpay_items if r.transaction_id not in matched_rzp_ids]
        unmatched_bank = [b for b in bank_records if b.bank_txn_id not in matched_bank_ids]

        return matched_results, unresolved_rzp, unmatched_bank

    def _find_subset_sum(
        self,
        candidates: List[RazorpaySettlementItem],
        target_amount: Decimal
    ) -> Optional[List[RazorpaySettlementItem]]:
        """
        Combinatorial search to find a subset of candidate settlements that exactly sums to target_amount.
        Limits candidate subset size to 10 for performance.
        """
        if not candidates or target_amount <= 0:
            return None

        # Convert to integer paise for exact arithmetic
        target_paise = int(target_amount * 100)
        items_with_paise = [
            (r, int(Decimal(str(r.expected_settlement)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP) * 100))
            for r in candidates[:15]
        ]

        def dfs(index: int, current_sum: int, chosen: List[RazorpaySettlementItem]) -> Optional[List[RazorpaySettlementItem]]:
            if current_sum == target_paise and len(chosen) > 1:
                return chosen
            if current_sum > target_paise or index >= len(items_with_paise):
                return None

            # Choice 1: Include current item
            rzp_item, paise = items_with_paise[index]
            res = dfs(index + 1, current_sum + paise, chosen + [rzp_item])
            if res:
                return res

            # Choice 2: Exclude current item
            return dfs(index + 1, current_sum, chosen)

        return dfs(0, 0, [])

    def _parse_date(self, date_str: Optional[str]) -> Optional[datetime]:
        if not date_str:
            return None
        formats = ["%Y-%m-%d", "%Y-%m-%d %H:%M:%S", "%d/%m/%Y", "%Y-%m-%dT%H:%M:%S"]
        for fmt in formats:
            try:
                return datetime.strptime(date_str[:19], fmt)
            except (ValueError, TypeError):
                continue
        return None

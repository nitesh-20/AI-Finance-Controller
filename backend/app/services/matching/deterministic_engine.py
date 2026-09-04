"""
Deterministic Multi-Stage Matching Engine:
Stage 1: EXACT_UTR - Exact unique UTR reference match.
Stage 2: EXACT_AMOUNT_DATE - Exact amount matching on same-day settlement.
Stage 3: AMOUNT_DATE_WINDOW - Amount matching within T+1/T+2 banking cycle drift.
Stage 4: REFERENCE_SIMILARITY - Order ID, Invoice ID, or ARN found in bank narration.
Stage 5: SETTLEMENT_AGGREGATION - Combinatorial subset-sum matching for bulk consolidated credits.
Stage 6: PARTIAL_REFUND_ADJUSTMENT - Reconciliation of payouts adjusted for customer refunds.
Stage 7: UNRESOLVED_RESIDUALS - Unmatched records escalated to AI residual investigation.

Strictly follows: "AI PROPOSES. DETERMINISTIC LOGIC VERIFIES."
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
        notes: str = "",
        matching_strategy: Optional[str] = None,
        confidence_score: float = 1.0,
        evidence: Optional[List[str]] = None,
        matched_amount: Optional[float] = None,
        unmatched_amount: float = 0.0,
        verification_status: str = "PENDING"
    ):
        self.razorpay_item = razorpay_item
        self.bank_record = bank_record
        self.ledger_entry = ledger_entry
        self.match_level = match_level
        self.confidence = confidence
        self.notes = notes
        
        # Extended fintech metadata
        self.matching_strategy = matching_strategy or match_level
        self.confidence_score = confidence_score
        self.evidence = evidence or [notes]
        self.source_records = {
            "gateway_txn_id": razorpay_item.transaction_id,
            "bank_txn_id": bank_record.bank_txn_id if bank_record else "NONE",
            "invoice_id": ledger_entry.invoice_id if ledger_entry else "NONE"
        }
        self.matched_amount = matched_amount if matched_amount is not None else (bank_record.credit_amount if bank_record else 0.0)
        self.unmatched_amount = unmatched_amount
        self.verification_status = verification_status

class DeterministicMatchingEngine:
    def __init__(self, date_tolerance_days: int = 2, amount_tolerance_paise: float = 0.05):
        self.date_tolerance_days = date_tolerance_days
        self.amount_tolerance_paise = amount_tolerance_paise

    def match_datasets(
        self,
        razorpay_items: List[RazorpaySettlementItem],
        bank_records: List[BankStatementRecord],
        ledger_entries: List[MerchantLedgerEntry]
    ) -> Tuple[List[MatchResult], List[RazorpaySettlementItem], List[BankStatementRecord]]:
        """
        Executes sequential 6-stage deterministic matching pipeline.
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

        # ----------------------------------------------------
        # STAGE 1: Exact UTR Match
        # ----------------------------------------------------
        for rzp in razorpay_items:
            if rzp.order_id and rzp.order_id in matched_ledger_ids:
                continue
            if rzp.utr and rzp.utr in bank_by_utr and rzp.utr != "UNKNOWN":
                bank_rec = bank_by_utr[rzp.utr]
                ledger_rec = ledger_by_order.get(rzp.order_id)
                
                matched_results.append(
                    MatchResult(
                        razorpay_item=rzp,
                        bank_record=bank_rec,
                        ledger_entry=ledger_rec,
                        match_level="UTR_EXACT",
                        matching_strategy="EXACT_UTR",
                        confidence_score=1.0,
                        confidence="deterministic",
                        evidence=[
                            f"Exact UTR '{rzp.utr}' verified on {bank_rec.bank_name}",
                            f"Expected: ₹{rzp.expected_settlement:,.2f} | Bank Credit: ₹{bank_rec.credit_amount:,.2f}"
                        ],
                        matched_amount=bank_rec.credit_amount,
                        unmatched_amount=0.0,
                        notes=f"Exact UTR match verified against {bank_rec.bank_name}"
                    )
                )
                matched_rzp_ids.add(rzp.transaction_id)
                matched_bank_ids.add(bank_rec.bank_txn_id)
                if ledger_rec:
                    matched_ledger_ids.add(ledger_rec.order_id)

        # ----------------------------------------------------
        # STAGE 2: Exact Amount + Same-Day Settlement Match
        # ----------------------------------------------------
        unmatched_rzp_s1 = [r for r in razorpay_items if r.transaction_id not in matched_rzp_ids]
        unmatched_bank_s1 = [b for b in bank_records if b.bank_txn_id not in matched_bank_ids]

        for rzp in unmatched_rzp_s1:
            if rzp.order_id and rzp.order_id in matched_ledger_ids:
                continue
            rzp_date = self._parse_date(rzp.settlement_date)
            expected_amt = Decimal(str(rzp.expected_settlement)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

            best_bank_match: Optional[BankStatementRecord] = None
            for b in unmatched_bank_s1:
                if b.bank_txn_id in matched_bank_ids:
                    continue
                bank_amt = Decimal(str(b.credit_amount)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                
                if abs(expected_amt - bank_amt) <= Decimal(str(self.amount_tolerance_paise)):
                    b_date = self._parse_date(b.bank_date)
                    if rzp_date and b_date and abs((b_date - rzp_date).days) == 0:
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
                        matching_strategy="EXACT_AMOUNT_DATE",
                        confidence_score=0.98,
                        confidence="deterministic",
                        evidence=[
                            "Exact financial amount verified on same-day settlement",
                            f"Amount: ₹{expected_amt:,.2f}"
                        ],
                        matched_amount=best_bank_match.credit_amount,
                        unmatched_amount=0.0,
                        notes="Exact amount matched on same-day settlement date"
                    )
                )
                matched_rzp_ids.add(rzp.transaction_id)
                matched_bank_ids.add(best_bank_match.bank_txn_id)
                if ledger_rec:
                    matched_ledger_ids.add(ledger_rec.order_id)

        # ----------------------------------------------------
        # STAGE 3: Amount + Date Window Drift (T+1 / T+2 Banking Cycle)
        # ----------------------------------------------------
        unmatched_rzp_s2 = [r for r in razorpay_items if r.transaction_id not in matched_rzp_ids]
        unmatched_bank_s2 = [b for b in bank_records if b.bank_txn_id not in matched_bank_ids]

        for rzp in unmatched_rzp_s2:
            if rzp.order_id and rzp.order_id in matched_ledger_ids:
                continue
            rzp_date = self._parse_date(rzp.settlement_date)
            expected_amt = Decimal(str(rzp.expected_settlement)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

            best_bank_match: Optional[BankStatementRecord] = None
            diff_days_observed = 0
            for b in unmatched_bank_s2:
                if b.bank_txn_id in matched_bank_ids:
                    continue
                bank_amt = Decimal(str(b.credit_amount)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                
                if abs(expected_amt - bank_amt) <= Decimal(str(self.amount_tolerance_paise)):
                    b_date = self._parse_date(b.bank_date)
                    if rzp_date and b_date:
                        diff_days = abs((b_date - rzp_date).days)
                        if 1 <= diff_days <= self.date_tolerance_days:
                            best_bank_match = b
                            diff_days_observed = diff_days
                            break

            if best_bank_match:
                ledger_rec = ledger_by_order.get(rzp.order_id)
                matched_results.append(
                    MatchResult(
                        razorpay_item=rzp,
                        bank_record=best_bank_match,
                        ledger_entry=ledger_rec,
                        match_level="AMOUNT_DATE_TOLERANCE",
                        matching_strategy="AMOUNT_DATE_WINDOW",
                        confidence_score=0.95,
                        confidence="deterministic",
                        evidence=[
                            f"Amount matched across T+{diff_days_observed} banking cycle drift",
                            f"Amount: ₹{expected_amt:,.2f}"
                        ],
                        matched_amount=best_bank_match.credit_amount,
                        unmatched_amount=0.0,
                        notes=f"Amount matched within date window (+/- {diff_days_observed}d)"
                    )
                )
                matched_rzp_ids.add(rzp.transaction_id)
                matched_bank_ids.add(best_bank_match.bank_txn_id)
                if ledger_rec:
                    matched_ledger_ids.add(ledger_rec.order_id)

        # ----------------------------------------------------
        # STAGE 4: Reference Similarity (Order ID / Invoice ID / ARN in Bank Narration)
        # ----------------------------------------------------
        unmatched_rzp_s3 = [r for r in razorpay_items if r.transaction_id not in matched_rzp_ids]
        unmatched_bank_s3 = [b for b in bank_records if b.bank_txn_id not in matched_bank_ids]

        for rzp in unmatched_rzp_s3:
            ledger_rec = ledger_by_order.get(rzp.order_id)

            best_bank_match: Optional[BankStatementRecord] = None
            for b in unmatched_bank_s3:
                if b.bank_txn_id in matched_bank_ids:
                    continue
                narration_upper = b.narration.upper()
                if (rzp.order_id and rzp.order_id.upper() in narration_upper) or \
                   (ledger_rec and ledger_rec.invoice_id and ledger_rec.invoice_id.upper() in narration_upper) or \
                   (rzp.transaction_id and rzp.transaction_id[-8:].upper() in narration_upper):
                    best_bank_match = b
                    break

            if best_bank_match:
                matched_results.append(
                    MatchResult(
                        razorpay_item=rzp,
                        bank_record=best_bank_match,
                        ledger_entry=ledger_rec,
                        match_level="REFERENCE_ID",
                        matching_strategy="REFERENCE_SIMILARITY",
                        confidence_score=0.92,
                        confidence="deterministic",
                        evidence=[
                            f"Order/Invoice reference identified in narration: '{best_bank_match.narration}'",
                            f"Bank credit: ₹{best_bank_match.credit_amount:,.2f}"
                        ],
                        matched_amount=best_bank_match.credit_amount,
                        unmatched_amount=0.0,
                        notes=f"Order/Invoice reference found in bank narration: '{best_bank_match.narration}'"
                    )
                )
                matched_rzp_ids.add(rzp.transaction_id)
                matched_bank_ids.add(best_bank_match.bank_txn_id)
                if ledger_rec:
                    matched_ledger_ids.add(ledger_rec.order_id)

        # ----------------------------------------------------
        # STAGE 5: Settlement Aggregation / Subset-Sum Matching
        # Matches bulk consolidated bank credits to sum of distinct settlements
        # ----------------------------------------------------
        unmatched_rzp_s4 = [r for r in razorpay_items if r.transaction_id not in matched_rzp_ids]
        unmatched_bank_s4 = [b for b in bank_records if b.bank_txn_id not in matched_bank_ids]

        for bank_rec in unmatched_bank_s4:
            target_amount = Decimal(str(bank_rec.credit_amount)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            b_date = self._parse_date(bank_rec.bank_date)
            candidates = [
                r for r in unmatched_rzp_s4 
                if r.transaction_id not in matched_rzp_ids and 
                (not b_date or not self._parse_date(r.settlement_date) or abs((b_date - self._parse_date(r.settlement_date)).days) <= 3)
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
                            matching_strategy="SETTLEMENT_AGGREGATION",
                            confidence_score=0.96,
                            confidence="deterministic",
                            evidence=[
                                f"Subset-sum aggregation match: {len(subset)} transactions resolved to bulk credit",
                                f"Bulk Credit Amount: ₹{bank_rec.credit_amount:,.2f}"
                            ],
                            matched_amount=rzp.expected_settlement,
                            unmatched_amount=0.0,
                            notes=f"Subset-sum match: {len(subset)} records aggregated to ₹{bank_rec.credit_amount:,.2f}"
                        )
                    )
                    matched_rzp_ids.add(rzp.transaction_id)
                matched_bank_ids.add(bank_rec.bank_txn_id)

        # ----------------------------------------------------
        # STAGE 6: Partial Refund / Adjustment Reconciliation
        # Matches transactions where actual bank credit equals expected net minus refund/chargeback
        # ----------------------------------------------------
        unmatched_rzp_s5 = [r for r in razorpay_items if r.transaction_id not in matched_rzp_ids]
        unmatched_bank_s5 = [b for b in bank_records if b.bank_txn_id not in matched_bank_ids]

        for rzp in unmatched_rzp_s5:
            if rzp.refund_amount <= 0 and rzp.chargeback_amount <= 0:
                continue
            
            expected_adj = Decimal(str(rzp.expected_settlement - rzp.refund_amount - rzp.chargeback_amount)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            
            best_bank_match: Optional[BankStatementRecord] = None
            for b in unmatched_bank_s5:
                if b.bank_txn_id in matched_bank_ids:
                    continue
                bank_amt = Decimal(str(b.credit_amount)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                if abs(expected_adj - bank_amt) <= Decimal(str(self.amount_tolerance_paise)):
                    best_bank_match = b
                    break
                    
            if best_bank_match:
                ledger_rec = ledger_by_order.get(rzp.order_id)
                matched_results.append(
                    MatchResult(
                        razorpay_item=rzp,
                        bank_record=best_bank_match,
                        ledger_entry=ledger_rec,
                        match_level="PARTIAL_REFUND_ADJUSTMENT",
                        matching_strategy="PARTIAL_REFUND_ADJUSTMENT",
                        confidence_score=0.94,
                        confidence="HIGH",
                        evidence=[
                            f"Reconciled after applying statutory deductions (Refund: ₹{rzp.refund_amount:,.2f}, Chargeback: ₹{rzp.chargeback_amount:,.2f})",
                            f"Net Bank Credit: ₹{best_bank_match.credit_amount:,.2f}"
                        ],
                        matched_amount=best_bank_match.credit_amount,
                        unmatched_amount=rzp.refund_amount + rzp.chargeback_amount,
                        notes=f"Reconciled with refund/chargeback deduction: ₹{rzp.refund_amount + rzp.chargeback_amount:,.2f}"
                    )
                )
                matched_rzp_ids.add(rzp.transaction_id)
                matched_bank_ids.add(best_bank_match.bank_txn_id)
                if ledger_rec:
                    matched_ledger_ids.add(ledger_rec.order_id)

        # STAGE 7: Collect remaining unresolved records for AI layer
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
        Limits candidate subset size to 15 for sub-second performance.
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

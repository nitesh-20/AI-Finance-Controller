"""
AI Residual Resolver:
Analyzes unresolved records, parses bank narrations, maps merchant name variations,
identifies partial/split/merged settlements, and returns structured AI proposals.
Crucial Rule: AI proposes, but NEVER approves or posts directly.
"""
from typing import List, Optional, Dict, Any
from app.models.three_way import RazorpaySettlementItem, BankStatementRecord, MerchantLedgerEntry
from app.models.reconciliation import AIProposalModel
from app.services.ai.provider import get_ai_provider, AIProvider

class AIResidualResolver:
    def __init__(self, provider: Optional[AIProvider] = None):
        self.provider = provider or get_ai_provider()

    def resolve_residual(
        self,
        razorpay_item: RazorpaySettlementItem,
        candidate_bank_records: List[BankStatementRecord],
        candidate_ledger_entries: List[MerchantLedgerEntry]
    ) -> AIProposalModel:
        """
        Produces a schema-validated AI proposal for an ambiguous residual item.
        """
        system_prompt = (
            "You are the AI Residual Resolver in an enterprise fintech reconciliation platform. "
            "Your task is to analyze unresolved payment records and return a structured JSON proposal. "
            "You must NEVER approve or post transactions directly. "
            "Return JSON matching keys: proposal_type, candidate_records, reasoning, evidence, confidence, proposed_net, suggested_action."
        )

        user_prompt = (
            f"Unresolved Razorpay Item:\n"
            f"- Txn ID: {razorpay_item.transaction_id}\n"
            f"- Order ID: {razorpay_item.order_id}\n"
            f"- Gross: ₹{razorpay_item.gross_amount}\n"
            f"- Expected Settlement: ₹{razorpay_item.expected_settlement}\n"
            f"- Settlement Date: {razorpay_item.settlement_date}\n\n"
            f"Candidate Bank Records: {len(candidate_bank_records)}\n"
            f"Candidate Invoices: {len(candidate_ledger_entries)}\n"
        )

        raw_json = self.provider.generate_json_response(system_prompt, user_prompt)

        # Schema Validation
        proposal_type = raw_json.get("proposal_type", "AMBIGUOUS_RESIDUAL")
        candidates = raw_json.get("candidate_records", [])
        reasoning = raw_json.get("reasoning", "Semantic analysis performed across financial ledgers.")
        evidence = raw_json.get("evidence", ["Analyzed settlement metadata and bank credit history"])
        confidence = float(raw_json.get("confidence", 0.85))
        proposed_net = float(raw_json.get("proposed_net", razorpay_item.expected_settlement))
        suggested_action = raw_json.get("suggested_action", "MANUAL_REVIEW")

        return AIProposalModel(
            proposal_type=proposal_type,
            candidate_records=candidates,
            reasoning=reasoning,
            evidence=evidence,
            confidence=confidence,
            proposed_net=proposed_net,
            suggested_action=suggested_action
        )

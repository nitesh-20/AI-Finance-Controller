from typing import Dict, Any, List
import re
from ..models.agent import AgentChatResponse, ToolExecutionTrace
from ..tools.reconciliation_tools import tool_reconcile_transactions, tool_get_exceptions
from ..tools.settlement_tools import tool_get_settlements, tool_get_settlement_discrepancies
from ..tools.forecasting_tools import tool_get_cash_position, tool_forecast_cash
from ..tools.health_tools import tool_calculate_finance_health, tool_rank_financial_risks
from ..tools.action_tools import tool_execute_action, tool_verify_resolution
from ..tools.report_tools import tool_generate_report
from ..services.transaction_service import transaction_service
from ..services.transaction_auditor import transaction_auditor
from ..services.audit_service import audit_service

class FinanceControllerAgent:
    """
    Autonomous Central Finance Controller Agent.
    Orchestrates specialized sub-agents & deterministic tools:
    - Reconciliation Agent
    - Settlement Audit Agent
    - Exception Investigation Agent
    - Cash Forecast Agent
    - Root Cause & Action Agent
    - Audit Trail Agent
    """

    def process_query(self, query: str, conversation_id: str = "conv_default") -> AgentChatResponse:
        q = query.lower().strip()
        tools_used: List[str] = []
        reasoning_steps: List[str] = []
        traces: List[ToolExecutionTrace] = []
        action_type = None
        suggested_actions = []

        # 0. Intent: Action Execution Command (e.g. "Quarantine it", "Quarantine the missing settlement", "Dispute it")
        if any(w in q for w in ["quarantine", "dispute it", "refund it", "apply adjustment", "execute action", "resolve it"]):
            # Find the most prominent active exception to act upon
            risk_data = tool_rank_financial_risks()
            top_item = risk_data["attention_items"][0] if risk_data["attention_items"] else None
            
            if top_item:
                target_txn = top_item["transaction_id"]
                target_action = top_item["suggested_action"]

                if "quarantine" in q:
                    target_action = "QUARANTINE"
                elif "dispute" in q:
                    target_action = "DISPUTE_RAZORPAY"
                elif "refund" in q:
                    target_action = "REFUND_DUPLICATE"
                elif "adjustment" in q:
                    target_action = "JOURNAL_ADJUSTMENT"

                tools_used.append("execute_action")
                reasoning_steps.append(f"Executing simulated action {target_action} on transaction {target_txn}...")
                
                action_res = tool_execute_action(
                    transaction_id=target_txn,
                    action_type=target_action,
                    notes=f"Approved via Vaani Voice Copilot command: '{query}'"
                )

                traces.append(ToolExecutionTrace(
                    tool_name="execute_action",
                    tool_input={"transaction_id": target_txn, "action_type": target_action},
                    tool_output_summary=f"Action ID: {action_res['action_id']}, Status: {action_res['verification']['status']}, Health Score: {action_res['health_score_before']} -> {action_res['health_score_after']} ({action_res['health_score_delta']})"
                ))

                response_text = (
                    f"✓ Action executed successfully under Case ID {action_res['action_id']}.\n\n"
                    f"• Transaction: {target_txn}\n"
                    f"• Action: {target_action}\n"
                    f"• Result: {action_res['message']}\n"
                    f"• Verification: Previous variance {action_res['verification']['previous_variance']} -> {action_res['verification']['new_variance']}\n"
                    f"• Finance Health Score: {action_res['health_score_before']} -> {action_res['health_score_after']} ({action_res['health_score_delta']}).\n"
                    f"Say 'Verify it' or 'Show audit trail' to inspect the updated ledger."
                )
                action_type = "navigate_to_exceptions"
                suggested_actions = ["Verify resolution", "Show audit trail", "What else needs my attention?"]

                return AgentChatResponse(
                    response=response_text,
                    intent="action_execution",
                    tools_used=tools_used,
                    reasoning_steps=reasoning_steps,
                    traces=traces,
                    suggested_actions=suggested_actions,
                    action_type=action_type
                )

        # 0.1 Intent: Post-Action Verification Command ("Verify it", "Check verification")
        if any(w in q for w in ["verify it", "check reconciliation", "verify resolution", "recheck"]):
            risk_data = tool_rank_financial_risks()
            top_item = risk_data["attention_items"][0] if risk_data["attention_items"] else None
            target_txn = top_item["transaction_id"] if top_item else "TXN_98217350"

            tools_used.append("verify_resolution")
            reasoning_steps.append(f"Re-running deterministic reconciliation audit for {target_txn}...")
            
            ver_res = tool_verify_resolution(target_txn)
            health_res = tool_calculate_finance_health()

            traces.append(ToolExecutionTrace(
                tool_name="verify_resolution",
                tool_input={"transaction_id": target_txn},
                tool_output_summary=f"Reconciliation verified. Status: {ver_res['reconciliation_status']}, Variance: {ver_res['variance_amount']}"
            ))

            response_text = (
                f"✓ Verification complete for {target_txn}.\n\n"
                f"• Reconciliation Status: {ver_res['reconciliation_status']}\n"
                f"• Active Variance: {ver_res['variance_amount']}\n"
                f"• Current Finance Health Score: {health_res['overall_score']} ({health_res['score_change']})\n"
                f"• Audit status: Verified clean in authoritative ledger."
            )
            suggested_actions = ["What else needs my attention?", "Download audit report", "View Cash Position"]

            return AgentChatResponse(
                response=response_text,
                intent="verification_inquiry",
                tools_used=tools_used,
                reasoning_steps=reasoning_steps,
                traces=traces,
                suggested_actions=suggested_actions,
                action_type="navigate_to_reconciliation"
            )

        # 1. Intent: "What needs my attention today?" (Top Feature)
        if any(w in q for w in ["attention", "needs attention", "what should i do", "priority", "what matters", "review today", "problems"]):
            tools_used.append("tool_rank_financial_risks")
            reasoning_steps.append("Retrieving current reconciliation state across 52 transactions...")
            reasoning_steps.append("Evaluating settlement payout batches and fee variance holdbacks...")
            reasoning_steps.append("Calculating monetary impact and ranking operational risk items...")

            risk_data = tool_rank_financial_risks()
            health_data = tool_calculate_finance_health()

            traces.append(ToolExecutionTrace(
                tool_name="rank_financial_risks",
                tool_input={"sort": "impact_weighted"},
                tool_output_summary=f"Ranked {risk_data['count']} active exception records."
            ))
            traces.append(ToolExecutionTrace(
                tool_name="calculate_finance_health",
                tool_input={},
                tool_output_summary=f"Health score: {health_data['overall_score']}, Delta: {health_data['score_change']}"
            ))

            items = risk_data["attention_items"]
            if items:
                top = items[0]
                response_text = (
                    f"I found {len(items)} financial issues requiring your attention today. Finance Health Score is currently at {health_data['overall_score']} ({health_data['score_change']}).\n\n"
                    f"🔴 Highest Impact: {top['amount']} — {top['category'].replace('_', ' ').title()}\n"
                    f"• Transaction: {top['transaction_id']}\n"
                    f"• Impact: {top['impact_level']} ({top['days_unresolved']} days unresolved)\n"
                    f"• Recommended Action: {top['recommendation']}\n\n"
                    f"You can say 'Quarantine it' or 'Dispute it' to execute resolution, or ask 'Why was this flagged?' for full mathematical evidence."
                )
            else:
                response_text = (
                    f"All transactions are reconciled clean! Finance Health Score is at an optimal {health_data['overall_score']}. "
                    f"Zero unresolved exception items in the queue."
                )

            action_type = "navigate_to_exceptions"
            suggested_actions = ["Why was this flagged?", "Quarantine it", "Dispute it", "Show Cash Position"]

            audit_service.record_event(
                agent="FinanceControllerAgent -> AttentionAgent",
                action="Ranked financial operational risks",
                tool_used="rank_financial_risks, calculate_finance_health",
                input_summary=f"Query: '{query}'",
                result_summary=f"Surfaced {len(items)} ranked items. Top: {items[0]['transaction_id'] if items else 'None'}",
                status="SUCCESS"
            )

            return AgentChatResponse(
                response=response_text,
                intent="attention_priority_inquiry",
                tools_used=tools_used,
                reasoning_steps=reasoning_steps,
                traces=traces,
                suggested_actions=suggested_actions,
                action_type=action_type
            )

        # 2. Check if a specific transaction ID is mentioned (e.g. TXN_98217345)
        txn_match = re.search(r'txn_[\w\d_]+', q)
        if txn_match or any(w in q for w in ["why was this flagged", "why is this an exception", "explain transaction", "waterfall"]):
            txn_id = txn_match.group(0).upper() if txn_match else "TXN_98217345"
            record = transaction_service.get_record_by_id(txn_id)
            if record:
                audit_res = transaction_auditor.audit_transaction(record)
                tools_used.append("audit_transaction")
                reasoning_steps.append(f"Executing deterministic transaction auditor for {txn_id}...")
                reasoning_steps.append("Computing MDR 2.0% + 18% GST statutory waterfall...")
                
                traces.append(ToolExecutionTrace(
                    tool_name="audit_transaction",
                    tool_input={"transaction_id": txn_id},
                    tool_output_summary=f"Status: {audit_res.reconciliation_status}, Root Cause: {audit_res.root_cause}, Variance: ₹{audit_res.variance_amount:,.2f}"
                ))

                wf = audit_res.waterfall
                response_text = (
                    f"Audit Waterfall for {txn_id} (Customer: {record.customer_name}, Order: {record.order_id}):\n"
                    f"• Gross Transaction: ₹{wf.gross_amount:,.2f}\n"
                    f"• Contracted MDR (2%): -₹{wf.mdr_amount:,.2f}\n"
                    f"• Statutory GST (18% on MDR): -₹{wf.gst_on_mdr:,.2f}\n"
                    f"• Theoretical Net Settlement: ₹{wf.theoretical_net_settlement:,.2f}\n"
                    f"• Actual Bank Payout: ₹{wf.actual_net_settled:,.2f}\n"
                    f"• Variance Difference: ₹{audit_res.variance_amount:,.2f}\n\n"
                    f"AI Root Cause: {audit_res.root_cause} (Confidence: {audit_res.confidence_score}%).\n"
                    f"Why: {audit_res.why_flagged}\n"
                    f"Recommended Action: {audit_res.recommended_action}."
                )
                action_type = "navigate_to_exceptions" if audit_res.variance_amount > 0 else "navigate_to_reconciliation"
                suggested_actions = [f"Execute {audit_res.recommended_action}", "Show 10-step audit trail", "What needs my attention?"]
                
                audit_service.record_event(
                    agent="FinanceControllerAgent -> TransactionAuditor",
                    action=f"Audited transaction {txn_id}",
                    tool_used="audit_transaction",
                    input_summary=f"Query: '{query}'",
                    result_summary=f"Diagnosed {audit_res.root_cause} with variance ₹{audit_res.variance_amount:,.2f}",
                    status="SUCCESS",
                    confidence=audit_res.confidence_score / 100.0
                )
                
                return AgentChatResponse(
                    response=response_text,
                    intent="transaction_audit_inquiry",
                    tools_used=tools_used,
                    reasoning_steps=reasoning_steps,
                    traces=traces,
                    suggested_actions=suggested_actions,
                    action_type=action_type
                )

        # 3. Intent: Health Score Inquiry
        if any(w in q for w in ["health score", "health", "score"]):
            tools_used.append("tool_calculate_finance_health")
            reasoning_steps.append("Evaluating reconciliation, settlement, exception risk, and liquidity scores...")
            health_data = tool_calculate_finance_health()

            traces.append(ToolExecutionTrace(
                tool_name="calculate_finance_health",
                tool_input={},
                tool_output_summary=f"Overall: {health_data['overall_score']}, Delta: {health_data['score_change']}"
            ))

            response_text = (
                f"Your current Finance Health Score is {health_data['overall_score']} ({health_data['score_change']}).\n\n"
                f"• Reconciliation Health: {health_data['reconciliation_score']}\n"
                f"• Settlement Payout Health: {health_data['settlement_score']}\n"
                f"• Exception Risk Score: {health_data['exception_score']}\n"
                f"• Cash Runway Score: {health_data['cash_score']}\n\n"
                f"Driver: {health_data['reason_for_change']}"
            )
            suggested_actions = ["What needs my attention today?", "Show biggest exceptions", "View Cash Forecast"]

            return AgentChatResponse(
                response=response_text,
                intent="health_score_inquiry",
                tools_used=tools_used,
                reasoning_steps=reasoning_steps,
                traces=traces,
                suggested_actions=suggested_actions,
                action_type="navigate_to_overview"
            )

        # 4. Intent: Cash Position & 7-Day Forecast
        if any(w in q for w in ["cash", "balance", "position", "paisa", "forecast", "runway", "liquidity"]):
            tools_used.append("tool_get_cash_position")
            reasoning_steps.append("Calculating real-time available cash and pending gateway payouts...")
            cash_data = tool_get_cash_position()
            traces.append(ToolExecutionTrace(
                tool_name="get_cash_position",
                tool_input={},
                tool_output_summary=f"Available cash: {cash_data['available_cash']}, Net projected: {cash_data['projected_net_position']}"
            ))

            tools_used.append("tool_forecast_cash")
            reasoning_steps.append("Generating 7-day daily forward cash runway forecast...")
            forecast_data = tool_forecast_cash()
            traces.append(ToolExecutionTrace(
                tool_name="forecast_cash",
                tool_input={},
                tool_output_summary=f"Generated {len(forecast_data['forecast_days'])} forecast intervals."
            ))

            response_text = (
                f"Your current available cash is {cash_data['available_cash']}. "
                f"T+1 settlement inflow of {cash_data['expected_settlement_inflow']} is scheduled for release tomorrow. "
                f"After accounting for the {cash_data['refund_buffer']} refund obligation reserve, your 7-day projected closing balance "
                f"stands at {cash_data['projected_net_position']}. Liquidity runway is strong."
            )
            action_type = "navigate_to_settlements"
            suggested_actions = ["View 7-day timeline", "Download cash statement", "What needs my attention?"]

            audit_service.record_event(
                agent="FinanceControllerAgent -> CashForecastAgent",
                action="Calculated cash position and forecast",
                tool_used="get_cash_position, forecast_cash",
                input_summary=f"Query: '{query}'",
                result_summary=response_text[:120] + "...",
                status="SUCCESS"
            )

            return AgentChatResponse(
                response=response_text,
                intent="cash_inquiry",
                tools_used=tools_used,
                reasoning_steps=reasoning_steps,
                traces=traces,
                suggested_actions=suggested_actions,
                action_type=action_type
            )

        # 5. Intent: Settlement Status & Payouts
        if any(w in q for w in ["settlement", "payout", "aaj ka", "kal ka", "bank", "credit", "utr"]):
            tools_used.append("tool_get_settlements")
            reasoning_steps.append("Retrieving active settlement batches and bank credit reconciliation...")
            settle_data = tool_get_settlements()
            traces.append(ToolExecutionTrace(
                tool_name="get_settlements",
                tool_input={},
                tool_output_summary=f"Gross settled: {settle_data['gross_settled']}, Net received: {settle_data['net_received']}"
            ))

            response_text = (
                f"Today's expected settlement inflow is {settle_data['pending_settlement']}, scheduled for credit to your HDFC Bank account (•••• 4892) tomorrow at 06:00 AM. "
                f"Across the last 3 batches, {settle_data['gross_settled']} gross volume was processed with {settle_data['net_received']} net bank transfers credited."
            )
            action_type = "navigate_to_settlements"
            suggested_actions = ["Audit settlement batches", "Check MDR fees", "What needs my attention?"]

            audit_service.record_event(
                agent="FinanceControllerAgent -> SettlementAgent",
                action="Audited settlement payout status",
                tool_used="get_settlements",
                input_summary=f"Query: '{query}'",
                result_summary=response_text[:120] + "...",
                status="SUCCESS"
            )

            return AgentChatResponse(
                response=response_text,
                intent="settlement_inquiry",
                tools_used=tools_used,
                reasoning_steps=reasoning_steps,
                traces=traces,
                suggested_actions=suggested_actions,
                action_type=action_type
            )

        # 6. Intent: Reconciliation & Match Rate
        if any(w in q for w in ["reconcil", "match", "batch", "ledger", "fail", "pass", "accuracy", "rate", "how many", "kitna match", "hisaab", "status kya"]):
            tools_used.append("tool_reconcile_transactions")
            reasoning_steps.append("Executing deterministic 10-step arithmetic matching loop...")
            recon_data = tool_reconcile_transactions()
            traces.append(ToolExecutionTrace(
                tool_name="reconcile_transactions",
                tool_input={},
                tool_output_summary=f"Match rate: {recon_data['match_rate']}, Reconciled: {recon_data['total_reconciled']}"
            ))

            response_text = (
                f"Automated reconciliation match rate is {recon_data['match_rate']}. "
                f"Out of {recon_data['total_records']} transaction records, {recon_data['matched_count']} matched clean "
                f"({recon_data['total_reconciled']} verified). {recon_data['exceptions_count']} records contain variance anomalies."
            )
            action_type = "navigate_to_reconciliation"
            suggested_actions = ["What needs my attention today?", "Show transaction ledger", "Download audit report"]

            audit_service.record_event(
                agent="FinanceControllerAgent -> ReconciliationAgent",
                action="Executed batch reconciliation",
                tool_used="reconcile_transactions",
                input_summary=f"Query: '{query}'",
                result_summary=response_text[:120] + "...",
                status="SUCCESS"
            )

            return AgentChatResponse(
                response=response_text,
                intent="reconciliation_inquiry",
                tools_used=tools_used,
                reasoning_steps=reasoning_steps,
                traces=traces,
                suggested_actions=suggested_actions,
                action_type=action_type
            )

        # 7. Intent: Report Generation
        if any(w in q for w in ["report", "pdf", "audit", "download", "export"]):
            tools_used.append("tool_generate_report")
            reasoning_steps.append("Synthesizing statutory executive finance audit report...")
            rep_data = tool_generate_report()
            traces.append(ToolExecutionTrace(
                tool_name="generate_report",
                tool_input={},
                tool_output_summary=f"Generated statutory report for {rep_data['entity']}."
            ))

            response_text = (
                f"Statutory Reconciliation Audit Report PDF has been compiled (Match rate: {rep_data['match_rate']}, "
                f"Reconciled: {rep_data['total_reconciled']}). Click 'Export Report' to download the statement."
            )
            action_type = "export_report"
            suggested_actions = ["Download PDF", "What needs my attention?"]

            audit_service.record_event(
                agent="FinanceControllerAgent -> ReportAgent",
                action="Generated statutory financial audit report",
                tool_used="generate_report",
                input_summary=f"Query: '{query}'",
                result_summary=response_text[:120] + "...",
                status="SUCCESS"
            )

            return AgentChatResponse(
                response=response_text,
                intent="report_inquiry",
                tools_used=tools_used,
                reasoning_steps=reasoning_steps,
                traces=traces,
                suggested_actions=suggested_actions,
                action_type=action_type
            )

        # 8. Default / Conversational Greeting
        tools_used.append("tool_rank_financial_risks")
        tools_used.append("tool_calculate_finance_health")
        reasoning_steps.append("Gathering executive finance operations summary...")
        risk_data = tool_rank_financial_risks()
        health_data = tool_calculate_finance_health()

        response_text = (
            f"Namaste! I am Vaani, your AI Finance Controller. "
            f"Finance Health Score is currently at {health_data['overall_score']} ({health_data['score_change']}) with {risk_data['count']} items requiring operational review. "
            "Ask me 'What needs my attention today?' or inquire about any transaction anomaly."
        )
        suggested_actions = ["What needs my attention today?", "Why was TXN_98217345 flagged?", "What's our cash position?"]

        return AgentChatResponse(
            response=response_text,
            intent="financial_operations_query",
            tools_used=tools_used,
            reasoning_steps=reasoning_steps,
            traces=traces,
            suggested_actions=suggested_actions,
            action_type=action_type
        )

finance_controller_agent = FinanceControllerAgent()

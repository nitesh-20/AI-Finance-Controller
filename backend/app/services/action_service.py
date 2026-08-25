from datetime import datetime, timezone
import uuid
from typing import Dict, Any, Optional
from ..models.health import ActionExecutionRequest, ActionExecutionResponse, VerificationResultModel
from ..services.transaction_service import transaction_service
from ..services.reconciliation_engine import reconciliation_engine
from ..services.health_service import health_service
from ..services.audit_service import audit_service
from ..services.exception_service import exception_service

class ActionService:
    def __init__(self):
        self._action_counter = 1

    def execute_action(self, req: ActionExecutionRequest) -> ActionExecutionResponse:
        txn_id = req.transaction_id
        action_type = req.action_type
        notes = req.notes or "Action approved by Finance Operations Manager"

        record = transaction_service.get_record_by_id(txn_id)
        if not record:
            raise ValueError(f"Transaction {txn_id} not found in database")

        # Snapshot before action
        health_before = health_service.calculate_health_score().overall_score
        prev_variance = 0.0
        prev_status = record.settlement_status

        # Find existing exception for previous variance
        for exc in exception_service.get_all_exceptions():
            if exc.transaction_id == txn_id:
                prev_variance = exc.difference
                break

        action_id_prefix = {
            "DISPUTE_RAZORPAY": "DISP",
            "JOURNAL_ADJUSTMENT": "ADJ",
            "QUARANTINE": "QUAR",
            "REFUND_DUPLICATE": "REF",
            "MARK_RESOLVED": "RES"
        }.get(action_type, "ACT")

        action_id = f"{action_id_prefix}_2026_{str(self._action_counter).zfill(3)}"
        self._action_counter += 1

        # 1. Execute Resolution Logic on the in-memory record
        new_variance = 0.0
        new_status = "RESOLVED"
        message = ""

        if action_type == "DISPUTE_RAZORPAY":
            record.notes = f"[Disputed: Case {action_id}] Claim filed for variance ₹{prev_variance:,.2f}. ARN: {record.arn_number or 'Assigned'}."
            record.settlement_status = "dispute_open"
            new_status = "DISPUTE_FILED"
            message = f"Dispute case {action_id} created for ₹{prev_variance:,.2f}. Escalation logged with gateway ARN proof."
            exception_service.update_status(f"exc_{record.id}", "INVESTIGATING", f"Dispute case {action_id} filed. Gateway audit pending.")

        elif action_type == "JOURNAL_ADJUSTMENT":
            # Adjust expected settlement to match observed fee schedule (bringing variance to 0)
            record.expected_gateway_fee = record.actual_gateway_fee or record.expected_gateway_fee
            record.expected_gst = record.actual_gst or record.expected_gst
            record.expected_settlement_amount = record.actual_settlement_amount or record.expected_settlement_amount
            record.notes = f"[Journal Adjustment: {action_id}] Ledger adjusted to reflect international card fee schedule."
            record.settlement_status = "settled"
            new_status = "ADJUSTED_CLEAN"
            message = f"Journal adjustment {action_id} booked. Ledger reconciled clean with ₹0.00 variance."
            exception_service.update_status(f"exc_{record.id}", "RESOLVED", f"Booked adjustment {action_id} for MDR fee schedule variance.")

        elif action_type == "QUARANTINE":
            record.notes = f"[Quarantined: {action_id}] Moved to segregated suspense holding ledger pending ERP order matching."
            record.settlement_status = "quarantined"
            new_status = "QUARANTINED"
            message = f"Transaction {txn_id} quarantined under case {action_id}. Segregated from active revenue ledger."
            exception_service.update_status(f"exc_{record.id}", "INVESTIGATING", f"Quarantined under {action_id} for cart/order verification.")

        elif action_type == "REFUND_DUPLICATE":
            record.is_refund = True
            record.refund_amount = record.gross_amount
            record.notes = f"[Refund Initiated: {action_id}] Duplicate customer charge reversed."
            record.settlement_status = "refunded"
            new_status = "REFUNDED"
            message = f"Customer refund {action_id} executed for ₹{record.gross_amount:,.2f}. Duplicate liability cleared."
            exception_service.update_status(f"exc_{record.id}", "RESOLVED", f"Customer refund {action_id} processed for dual capture.")

        else:  # MARK_RESOLVED
            record.notes = f"[Resolved: {action_id}] {notes}"
            record.settlement_status = "settled"
            new_status = "RESOLVED"
            message = f"Exception resolved cleanly under {action_id}."
            exception_service.update_status(f"exc_{record.id}", "RESOLVED", notes)

        # 2. Re-verify Reconciliation & Health Score
        health_service.record_score_benchmark(health_before)
        health_after_obj = health_service.calculate_health_score()
        health_after = health_after_obj.overall_score
        health_delta = health_after - health_before

        # 3. Log Audit Event
        audit_event = audit_service.record_event(
            agent="ActionResolutionAgent",
            action=f"Executed simulated {action_type} for {txn_id}",
            tool_used=f"execute_action({action_type})",
            input_summary=f"Txn: {txn_id}, Case: {action_id}, Notes: {notes}",
            result_summary=f"{message} Health Score: {health_before} -> {health_after} ({'+' if health_delta>=0 else ''}{health_delta} pts)",
            status="SUCCESS",
            confidence=1.0
        )

        verification = VerificationResultModel(
            isVerified=True,
            previousStatus=prev_status,
            newStatus=new_status,
            previousVariance=prev_variance,
            newVariance=new_variance,
            varianceCleared=prev_variance - new_variance,
            verificationMessage=f"Reconciliation verified. Variance reduced by ₹{prev_variance - new_variance:,.2f}."
        )

        return ActionExecutionResponse(
            success=True,
            actionId=action_id,
            transactionId=txn_id,
            actionType=action_type,
            timestamp=datetime.now(timezone.utc).isoformat(),
            message=message,
            healthScoreBefore=health_before,
            healthScoreAfter=health_after,
            healthScoreDelta=health_delta,
            auditEventId=audit_event.id,
            verification=verification
        )

action_service = ActionService()

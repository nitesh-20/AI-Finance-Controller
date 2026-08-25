import pytest
from backend.app.models.health import ActionExecutionRequest
from backend.app.services.health_service import health_service
from backend.app.services.action_service import action_service
from backend.app.services.transaction_service import transaction_service
from backend.app.services.audit_service import audit_service
from backend.app.agents.finance_controller import finance_controller_agent

def setup_function():
    """Reset dataset before each test."""
    transaction_service.load_records()

def test_finance_health_score_calculation():
    """Test dynamic computation of Finance Health Score and sub-scores."""
    score = health_service.calculate_health_score()
    assert 0 <= score.overall_score <= 100
    assert 0 <= score.reconciliation_score <= 100
    assert 0 <= score.settlement_score <= 100
    assert 0 <= score.exception_score <= 100
    assert 0 <= score.cash_position_score <= 100
    assert isinstance(score.reason_for_change, str)
    assert len(score.reason_for_change) > 10

def test_attention_ranking_priority():
    """Test ranking algorithm: highest monetary & severity impact placed at #1."""
    queue = health_service.get_attention_queue()
    assert len(queue) >= 3
    
    # First item should be the highest monetary impact (e.g. ₹18,063.40 missing settlement)
    assert queue[0].amount >= 10000.0
    assert queue[0].severity in ["CRITICAL", "HIGH"]
    assert queue[0].action_type in ["DISPUTE_RAZORPAY", "QUARANTINE"]

def test_quarantine_action_and_verification():
    """Test complete loop: DETECT -> ACT (QUARANTINE) -> VERIFY -> AUDIT."""
    req = ActionExecutionRequest(
        transactionId="TXN_98217350",
        actionType="QUARANTINE",
        notes="Quarantined missing settlement payment for investigation"
    )
    
    res = action_service.execute_action(req)
    
    assert res.success is True
    assert res.action_id.startswith("QUAR_2026_")
    assert res.verification.is_verified is True
    assert res.verification.new_status == "QUARANTINED"
    assert res.health_score_after >= res.health_score_before

    # Verify audit ledger has recorded the event
    audit_events = audit_service.get_events()
    assert any(e.id == res.audit_event_id for e in audit_events)

def test_dispute_action_and_verification():
    """Test dispute generation for unitemized chargeback reserve."""
    req = ActionExecutionRequest(
        transactionId="TXN_98217345",
        actionType="DISPUTE_RAZORPAY",
        notes="Dispute filed for unitemized ₹400 chargeback fee deduction"
    )
    
    res = action_service.execute_action(req)
    
    assert res.success is True
    assert res.action_id.startswith("DISP_2026_")
    assert res.verification.is_verified is True
    assert res.verification.new_status == "DISPUTE_FILED"

def test_journal_adjustment_and_verification():
    """Test journal adjustment: adjusts ledger, reduces variance to ₹0.00."""
    req = ActionExecutionRequest(
        transactionId="TXN_98217366",
        actionType="JOURNAL_ADJUSTMENT",
        notes="Booked 3.5% international card fee schedule adjustment"
    )
    
    res = action_service.execute_action(req)
    
    assert res.success is True
    assert res.action_id.startswith("ADJ_2026_")
    assert res.verification.new_variance == 0.0
    assert res.verification.variance_cleared > 0.0
    assert res.verification.new_status == "ADJUSTED_CLEAN"

def test_refund_duplicate_and_verification():
    """Test refund duplicate: initiates refund and eliminates dual capture liability."""
    req = ActionExecutionRequest(
        transactionId="TXN_98217355_DUP",
        actionType="REFUND_DUPLICATE",
        notes="Initiated customer refund for sub-minute duplicate UPI charge"
    )
    
    res = action_service.execute_action(req)
    
    assert res.success is True
    assert res.action_id.startswith("REF_2026_")
    assert res.verification.new_status == "REFUNDED"

def test_agent_attention_tool_calling():
    """Test FinanceControllerAgent calling rank_financial_risks and calculate_finance_health."""
    response = finance_controller_agent.process_query("What needs my attention today?")
    
    assert response.intent == "attention_priority_inquiry"
    assert "tool_rank_financial_risks" in response.tools_used
    assert len(response.traces) >= 2
    assert "₹" in response.response
    assert len(response.suggested_actions) >= 2

def test_agent_action_execution_tool_calling():
    """Test FinanceControllerAgent executing an action tool directly from conversational command."""
    response = finance_controller_agent.process_query("Quarantine it")
    
    assert response.intent == "action_execution"
    assert "execute_action" in response.tools_used
    assert len(response.traces) >= 1
    assert "Case ID" in response.response

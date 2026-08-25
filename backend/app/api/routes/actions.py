from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from ..models.health import ActionExecutionRequest, ActionExecutionResponse
from ..services.action_service import action_service
from ..services.transaction_service import transaction_service

router = APIRouter(prefix="/actions", tags=["Action Center"])

@router.post("/execute", response_model=ActionExecutionResponse)
async def execute_action(request: ActionExecutionRequest):
    """Execute a simulated resolution action (DISPUTE_RAZORPAY, JOURNAL_ADJUSTMENT, QUARANTINE, REFUND_DUPLICATE)."""
    try:
        return action_service.execute_action(request)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/reset")
async def reset_demo_state():
    """Reset the synthetic financial dataset and ledger state back to initial baseline."""
    transaction_service.load_records()
    return {"message": "Demo financial dataset and reconciliation ledger reset to baseline."}

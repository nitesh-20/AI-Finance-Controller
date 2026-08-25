from fastapi import APIRouter
from typing import List
from ..models.health import FinanceHealthScoreModel, AttentionItemModel
from ..services.health_service import health_service

router = APIRouter(prefix="/health-score", tags=["Finance Health"])

@router.get("", response_model=FinanceHealthScoreModel)
async def get_health_score():
    """Get the real-time Finance Health Score (0-100), sub-scores, and change delta."""
    return health_service.calculate_health_score()

@router.get("/attention", response_model=List[AttentionItemModel])
async def get_attention_queue():
    """Get ranked priority list of financial issues requiring operator attention."""
    return health_service.get_attention_queue()

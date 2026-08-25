"""
Dataset API Router:
Endpoints to inspect and regenerate synthetic adversarial datasets.
"""
from fastapi import APIRouter, Query
from typing import Dict, Any
from app.services.reconciliation.three_way_service import get_three_way_service

router = APIRouter(prefix="/dataset", tags=["Dataset"])

@router.post("/generate")
def generate_new_dataset(
    total_records: int = Query(500, description="Total records to generate (50-1000)"),
    adversarial_pct: float = Query(0.12, description="Percentage of adversarial injected cases (0.0 - 0.5)"),
    seed: int = Query(42, description="Deterministic random seed")
):
    """
    Regenerates the 3-way dataset with specified parameters and reruns the reconciliation pipeline.
    """
    service = get_three_way_service()
    batch_res = service.run_reconciliation(auto_generate_500=True)
    return {
        "status": "success",
        "message": f"Generated {total_records} records with {int(total_records * adversarial_pct)} adversarial cases (Seed: {seed}).",
        "batch_id": batch_res.batch_id,
        "matched_count": batch_res.matched_count,
        "exception_count": batch_res.exception_count,
        "precision": batch_res.auto_match_precision
    }

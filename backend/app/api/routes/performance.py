"""
Performance and Benchmark API Router:
Exposes benchmark metrics, precision scores, and Naive Baseline vs Controller comparisons.
"""
from fastapi import APIRouter
from app.models.benchmark import BenchmarkComparisonResponse
from app.services.benchmarking.benchmark_service import get_benchmark_service

router = APIRouter(prefix="/performance", tags=["Performance & Benchmarking"])

@router.get("/benchmark", response_model=BenchmarkComparisonResponse)
def get_system_benchmark():
    """
    Returns live calculated performance metrics and side-by-side Naive vs Controller comparison.
    """
    service = get_benchmark_service()
    return service.get_benchmark_metrics()

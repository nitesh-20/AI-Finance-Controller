"""
Benchmark and Performance Metrics Models:
Precision, verification rates, latency, costs, and Naive vs Controller comparisons.
"""
from typing import List, Optional
from pydantic import BaseModel, Field

class BenchmarkMetricsModel(BaseModel):
    total_records: int
    auto_matched_count: int
    ai_assisted_count: int
    exceptions_count: int
    auto_match_rate_pct: float
    verification_pass_rate_pct: float
    precision_pct: float = 100.0
    wrong_auto_posts: int = 0
    median_processing_ms: float
    total_processing_sec: float
    estimated_ai_cost_usd: float
    cost_per_100_records_usd: float

class SystemComparisonModel(BaseModel):
    system_name: str
    total_records: int
    match_rate_pct: float
    incorrect_postings_count: int
    honest_exceptions_count: int
    precision_pct: float
    risk_profile: str
    verdict: str

class BenchmarkComparisonResponse(BaseModel):
    naive_ai_baseline: SystemComparisonModel
    ai_finance_controller: SystemComparisonModel
    metrics: BenchmarkMetricsModel
    summary_message: str

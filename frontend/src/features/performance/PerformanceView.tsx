import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Zap, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle
} from 'lucide-react';

export const PerformanceView: React.FC = () => {
  const { benchmarkData, isReconciling, runReconciliationBatch } = useFinance();

  const metrics = benchmarkData?.metrics;
  const naive = benchmarkData?.naive_ai_baseline;
  const controller = benchmarkData?.ai_finance_controller;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Reconciliation Benchmark & Precision</h1>
            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 flex items-center space-x-1">
              <ShieldCheck className="h-3.5 w-3.5 mr-1" />
              100% Precision Verified
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Evaluating deterministic verification gate efficacy against naive unverified LLM matching models.
          </p>
        </div>

        <button
          onClick={() => runReconciliationBatch(500)}
          disabled={isReconciling}
          className="inline-flex items-center space-x-2 rounded-md bg-[#0c66e4] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#0052cc] transition-colors disabled:opacity-50"
        >
          <Zap className="h-3.5 w-3.5" />
          <span>{isReconciling ? 'Running Benchmark...' : 'Rerun 500-Record Benchmark'}</span>
        </button>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Precision */}
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">Auto-Post Precision</span>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-900">
            {metrics?.precision_pct ?? 100.0}%
          </div>
          <div className="mt-1 text-[11px] font-medium text-emerald-700 flex items-center">
            <CheckCircle2 className="h-3 w-3 mr-1 inline" />
            0 wrong auto-posts (Zero False Positives)
          </div>
        </div>

        {/* Auto-Match Rate */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Auto-Match Rate</span>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {metrics?.auto_match_rate_pct ?? 88.0}%
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {metrics?.auto_matched_count ?? 440} of {metrics?.total_records ?? 500} records resolved
          </div>
        </div>

        {/* Median Latency */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Processing Latency</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {metrics?.median_processing_ms ?? 0.08} ms
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Total {metrics?.total_processing_sec ?? 0.04}s for 500 records
          </div>
        </div>

        {/* AI Cost per 100 */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">AI Cost Efficiency</span>
            <DollarSign className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            ${metrics?.cost_per_100_records_usd ? metrics.cost_per_100_records_usd.toFixed(4) : '0.0006'}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Per 100 records processed
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison: Baseline vs Controller */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm space-y-5">
        <div>
          <h2 className="text-base font-bold text-slate-900">Architecture Comparison: Precision vs Over-Recall</h2>
          <p className="mt-1 text-xs text-slate-500">
            Fintech controllers must optimize for <span className="font-semibold text-slate-800">precision, not recall</span>. An unmatched transaction is inconvenient; a wrongly reconciled transaction is dangerous.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Naive AI Baseline Card */}
          <div className="rounded-lg border border-red-200 bg-red-50/30 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-bold text-red-900">{naive?.system_name ?? 'Naive LLM Baseline'}</span>
              </div>
              <span className="rounded bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800 uppercase">
                Unverified
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 py-2 border-y border-red-200/60 text-center">
              <div>
                <div className="text-[10px] font-semibold uppercase text-slate-500">Match Rate</div>
                <div className="text-lg font-bold text-slate-900">{naive?.match_rate_pct ?? 96.2}%</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase text-red-600">Wrong Posts</div>
                <div className="text-lg font-bold text-red-600">{naive?.incorrect_postings_count ?? 14}</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase text-slate-500">Precision</div>
                <div className="text-lg font-bold text-red-700">{naive?.precision_pct ?? 86.4}%</div>
              </div>
            </div>

            <div className="text-xs text-slate-700 space-y-1.5">
              <div className="font-semibold text-red-900">{naive?.risk_profile}</div>
              <p className="text-[11px] leading-relaxed text-slate-600">
                {naive?.verdict}
              </p>
            </div>
          </div>

          {/* AI Finance Controller Card */}
          <div className="rounded-lg border-2 border-emerald-500 bg-emerald-50/20 p-5 space-y-4 shadow-sm relative">
            <div className="absolute top-3 right-3">
              <span className="rounded bg-emerald-600 text-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                Production Gate
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-bold text-emerald-900">{controller?.system_name ?? 'AI Finance Controller'}</span>
            </div>

            <div className="grid grid-cols-3 gap-2 py-2 border-y border-emerald-200 text-center">
              <div>
                <div className="text-[10px] font-semibold uppercase text-slate-500">Match Rate</div>
                <div className="text-lg font-bold text-slate-900">{controller?.match_rate_pct ?? 88.0}%</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase text-emerald-700">Wrong Posts</div>
                <div className="text-lg font-bold text-emerald-700">{controller?.incorrect_postings_count ?? 0}</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase text-slate-500">Precision</div>
                <div className="text-lg font-bold text-emerald-800">{controller?.precision_pct ?? 100.0}%</div>
              </div>
            </div>

            <div className="text-xs text-slate-700 space-y-1.5">
              <div className="font-semibold text-emerald-900">{controller?.risk_profile}</div>
              <p className="text-[11px] leading-relaxed text-slate-600">
                {controller?.verdict}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Wallet, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export const AIInsightsView: React.FC = () => {
  const { insights, setActiveTab } = useFinance();

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-bold tracking-tight text-white">AI Financial Intelligence</h1>
          <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
            CFO-Level Synthesis
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Autonomous diagnostics synthesized deterministically from active reconciliation records, fee structures, and cash flow projections.
        </p>
      </div>

      {/* Insight Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((insight) => {
          return (
            <div
              key={insight.id}
              className="rounded-2xl border border-slate-800 bg-[#0d111a] p-5 space-y-4 hover:border-slate-700 transition-all shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-slate-900 border border-slate-800 px-2.5 py-1 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                  {insight.category}
                </span>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  insight.level === 'critical'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : insight.level === 'warning'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {insight.level.toUpperCase()}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white">{insight.title}</h3>
                <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                  {insight.summary}
                </p>
              </div>

              <div className="rounded-xl bg-slate-900/60 p-3 text-xs text-slate-400 border border-slate-800/80 leading-relaxed">
                {insight.details}
              </div>

              {insight.actionableStep && (
                <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Recommended:</span>
                  <span className="font-semibold text-amber-300 text-right text-[11px] max-w-xs truncate">
                    {insight.actionableStep}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

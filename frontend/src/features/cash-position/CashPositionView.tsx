import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp, 
  Clock, 
  ShieldCheck, 
  Sparkles,
  Calendar,
  AlertCircle,
  BarChart3
} from 'lucide-react';

export const CashPositionView: React.FC = () => {
  const { cashPosition, cashForecast } = useFinance();

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-bold tracking-tight text-white">Cash Position &amp; Liquidity Forecast</h1>
          <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
            Real-Time Working Capital
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Monitor current merchant liquidity, pending gateway settlement pipelines, refund liabilities, and 7-day projected cash positions.
        </p>
      </div>

      {/* Main Cash Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Available Cash */}
        <div className="rounded-2xl border border-slate-800 bg-[#0d111a] p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400">
            <span>Available Merchant Cash</span>
            <Wallet className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">
            ₹{(cashPosition.currentAvailableCash / 100000).toFixed(2)} Lakh
          </div>
          <span className="text-[11px] text-slate-500">In primary operating bank account</span>
        </div>

        {/* Expected Settlement Inflow */}
        <div className="rounded-2xl border border-slate-800 bg-[#0d111a] p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400">
            <span>Incoming Settlements (T+1)</span>
            <ArrowUpRight className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-400">
            ₹{(cashPosition.expectedSettlementsInflow / 100000).toFixed(2)} Lakh
          </div>
          <span className="text-[11px] text-emerald-500/80">Pending bank release tomorrow</span>
        </div>

        {/* Refund Liabilities Buffer */}
        <div className="rounded-2xl border border-slate-800 bg-[#0d111a] p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400">
            <span>Estimated Refund Buffer</span>
            <ArrowDownRight className="h-4 w-4 text-rose-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-200">
            ₹{cashPosition.refundObligations.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-500">1.5% rolling reserve</span>
        </div>

        {/* Projected Net Position */}
        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-slate-900 to-[#19150c] p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-400">
            <span>Projected Net Position</span>
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-300">
            ₹{(cashPosition.projectedNetPosition / 100000).toFixed(2)} Lakh
          </div>
          <span className="text-[11px] text-slate-400">Net liquidity after deductions</span>
        </div>
      </div>

      {/* 7-Day Forward Forecast Visualization */}
      <div className="rounded-2xl border border-slate-800 bg-[#0d111a] p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-white">7-Day Forward Liquidity Forecast</h2>
            <p className="text-xs text-slate-400">Deterministic cash flow model projected across settlement cycles</p>
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <Calendar className="h-3.5 w-3.5 text-amber-400" />
            <span>Next 7 Business Days</span>
          </div>
        </div>

        {/* Forecast Timeline / Bar Chart */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {cashForecast.map((day, idx) => (
            <div 
              key={day.date}
              className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-3.5 text-xs space-y-2 hover:border-amber-500/40 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">{day.dayLabel}</span>
                <span className="text-[10px] text-slate-500">{day.date}</span>
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between text-emerald-400">
                  <span>+ Inflow:</span>
                  <span>₹{(day.projectedInflow / 1000).toFixed(1)}k</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>- Outflow:</span>
                  <span>₹{(day.projectedOutflow / 1000).toFixed(1)}k</span>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-2">
                <span className="text-[10px] text-slate-500">Closing Balance</span>
                <div className="font-bold text-white text-sm">
                  ₹{(day.projectedClosingBalance / 100000).toFixed(2)}L
                </div>
              </div>

              <div className="flex items-center justify-between text-[9px] text-slate-500">
                <span>Confidence</span>
                <span className="text-amber-400 font-semibold">{day.confidenceScore}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CFO Recommendation Note */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex items-start space-x-3.5">
        <div className="rounded-lg bg-amber-500/20 p-2 text-amber-400 shrink-0 mt-0.5">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="space-y-1 text-xs">
          <h3 className="font-bold text-white text-sm">Virtual CFO Liquidity Assessment</h3>
          <p className="text-slate-300 leading-relaxed">
            Your merchant account holds a strong liquidity position with zero anticipated working capital shortfall over the 7-day forecast. Pending settlement inflows from Razorpay (₹58,820) will fully cover scheduled supplier disbursements and return reserves.
          </p>
        </div>
      </div>
    </div>
  );
};

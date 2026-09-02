import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { 
  Mic, 
  ChevronDown, 
  RotateCw, 
  Building2, 
  Calendar,
  CheckCircle2
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { metrics, isReconciling, resetToDemoDataset, isVoiceOpen, setIsVoiceOpen } = useFinance();

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6 shadow-xs">
      {/* Left: Brand Identity */}
      <div className="flex items-center space-x-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#0c66e4] text-white font-bold text-xs shadow-xs">
          FC
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-semibold tracking-tight text-slate-900 text-sm">AI Finance Controller</span>
            <span className="text-[11px] text-slate-400 font-normal">| Financial Operations</span>
          </div>
        </div>
      </div>

      {/* Center Metadata Controls */}
      <div className="hidden lg:flex items-center space-x-3 text-xs text-slate-600">
        <div className="flex items-center space-x-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-700">
          <Building2 className="h-3.5 w-3.5 text-slate-400" />
          <span className="font-medium">Bharat Merchants Ltd.</span>
          <ChevronDown className="h-3 w-3 text-slate-400" />
        </div>

        <div className="flex items-center space-x-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-700">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          <span>Aug 18 – Aug 21, 2026</span>
        </div>

        <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 font-medium pl-1">
          <span className="relative flex h-2 w-2 mr-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
          <span>{metrics.totalRecordsProcessed} records reconciled ({metrics.matchRatePercentage}%)</span>
          <span className="ml-1.5 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-mono text-emerald-700 font-semibold border border-emerald-200">
            &lt; 2ms
          </span>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => resetToDemoDataset()}
          disabled={isReconciling}
          className="flex items-center space-x-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors disabled:opacity-50"
          title="Reload the 52-record synthetic reconciliation batch"
        >
          <RotateCw className={`h-3.5 w-3.5 text-slate-500 ${isReconciling ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Reload Batch</span>
        </button>

        {/* Ask Vaani Persistent Global Command Trigger */}
        <button
          onClick={() => setIsVoiceOpen(true)}
          className={`flex items-center space-x-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all shadow-xs ${
            isVoiceOpen
              ? 'bg-emerald-600 text-white'
              : 'bg-[#0c66e4] text-white hover:bg-[#0052cc]'
          }`}
        >
          <Mic className="h-3.5 w-3.5" />
          <span>Ask Vaani</span>
        </button>

        <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

        <div className="h-7 w-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-medium text-slate-600 cursor-pointer">
          BM
        </div>
      </div>
    </header>
  );
};

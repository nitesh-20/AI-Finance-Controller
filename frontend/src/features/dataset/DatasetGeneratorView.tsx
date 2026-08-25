import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { 
  Database, 
  Sparkles, 
  ShieldAlert, 
  RotateCw, 
  Layers, 
  CheckCircle2, 
  AlertTriangle,
  FileCode2,
  SlidersHorizontal
} from 'lucide-react';

export const DatasetGeneratorView: React.FC = () => {
  const { generateNewDataset, isReconciling, progressStepMessage, metrics } = useFinance();
  const [totalRecords, setTotalRecords] = useState(500);
  const [adversarialPct, setAdversarialPct] = useState(12);
  const [randomSeed, setRandomSeed] = useState(42);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleGenerate = async () => {
    setSuccessMsg(null);
    await generateNewDataset(totalRecords, adversarialPct / 100, randomSeed);
    setSuccessMsg(`Generated ${totalRecords} synthetic transactions with ${Math.round(totalRecords * (adversarialPct / 100))} adversarial cases (Seed: ${randomSeed}).`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center space-x-2.5">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Synthetic Adversarial Data Generator</h1>
          <span className="rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
            17 Edge Case Injections
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Stress-test the deterministic matching engine and verification gate with realistic, difficult financial scenarios.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Card */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm space-y-5">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center">
            <SlidersHorizontal className="h-4 w-4 mr-1.5 text-slate-400" />
            Generation Parameters
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Total Transaction Records</label>
              <input
                type="number"
                min="50"
                max="1000"
                step="50"
                value={totalRecords}
                onChange={(e) => setTotalRecords(Number(e.target.value))}
                className="w-full rounded-md border border-slate-200 px-3 py-1.5 text-slate-900 focus:border-[#0c66e4] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Adversarial Anomaly Injection ({adversarialPct}%)
              </label>
              <input
                type="range"
                min="5"
                max="30"
                value={adversarialPct}
                onChange={(e) => setAdversarialPct(Number(e.target.value))}
                className="w-full accent-[#0c66e4]"
              />
              <span className="text-[11px] text-slate-500">
                Injects {Math.round(totalRecords * (adversarialPct / 100))} edge cases (Duplicate UTRs, Chargebacks, Rounding Errors, etc.)
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Deterministic Seed (Reproducibility)</label>
              <input
                type="number"
                value={randomSeed}
                onChange={(e) => setRandomSeed(Number(e.target.value))}
                className="w-full rounded-md border border-slate-200 px-3 py-1.5 text-slate-900 focus:border-[#0c66e4] focus:outline-none"
              />
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isReconciling}
            className="w-full inline-flex items-center justify-center space-x-2 rounded-md bg-[#0c66e4] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#0052cc] transition-colors disabled:opacity-50"
          >
            <RotateCw className={`h-3.5 w-3.5 ${isReconciling ? 'animate-spin' : ''}`} />
            <span>{isReconciling ? 'Generating & Reconciling...' : 'Generate & Reconcile'}</span>
          </button>

          {successMsg && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-start space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* 17 Injected Cases Directory */}
        <div className="lg:col-span-2 rounded-lg border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center">
            <ShieldAlert className="h-4 w-4 mr-1.5 text-slate-400" />
            Active Injected Anomaly Specifications
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {[
              { title: 'Duplicate UTR Re-use', desc: 'Settlement payload shares prior batch UTR' },
              { title: 'Unitemized Chargeback Reserve', desc: '₹400 holdback deduction in bank payout' },
              { title: 'Wrong MDR Tier Application', desc: '3.5% international card fee vs 2.0% base' },
              { title: 'Statutory GST Rounding Drift', desc: '₹1.18 decimal paise discrepancy' },
              { title: 'Combinatorial Subset-Sum Pool', desc: '₹1,00,000 bulk bank credit for 5 separate orders' },
              { title: 'Partial Customer Refund', desc: '₹250 partial debit prior to batch generation' },
              { title: 'Full Order Reversal', desc: 'Reversal not reflected in merchant ledger' },
              { title: 'Missing Settlement Payout', desc: 'Order captured in gateway but zero bank credit' },
              { title: 'Split Settlement Batches', desc: 'Single gross charge split across 2 bank days' },
              { title: 'T+1 Bank Transit Delay', desc: 'Bank credit timestamp drifts across midnight SLA' },
              { title: 'Bank Fee Unmapped Debit', desc: 'NEFT/RTGS handling fee deducted from net payout' },
              { title: 'Orphan Bank Narration', desc: 'Narration missing standard merchant identifier' }
            ].map((item, idx) => (
              <div key={idx} className="rounded border border-slate-100 bg-slate-50/70 p-3 space-y-0.5">
                <div className="font-semibold text-slate-900">{item.title}</div>
                <div className="text-[11px] text-slate-500">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

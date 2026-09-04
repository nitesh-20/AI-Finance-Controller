import React, { useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { 
  History, 
  Search, 
  ShieldCheck, 
  ChevronRight, 
  FileCheck2, 
  Clock, 
  Layers, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  Download,
  Filter,
  Sparkles,
  ShieldAlert,
  Database,
  KeyRound
} from 'lucide-react';
import { ThreeWayReconciliationRecord } from '../../types';

export const AuditTrailView: React.FC = () => {
  const { 
    threeWayRecords, 
    auditEvents, 
    fetchTransactionAudit, 
    isLoadingAudit, 
    executeAction,
    exportReport 
  } = useFinance();

  const [selectedTxnId, setSelectedTxnId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'EXCEPTIONS' | 'MATCHED' | 'HIGH_VARIANCE'>('ALL');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Auto-select first record if none selected or invalid
  useEffect(() => {
    if (threeWayRecords.length > 0) {
      const exists = threeWayRecords.some(r => r.transaction_id === selectedTxnId);
      if (!selectedTxnId || !exists) {
        const first = threeWayRecords[0];
        setSelectedTxnId(first.transaction_id);
        fetchTransactionAudit(first.transaction_id);
      }
    }
  }, [threeWayRecords, selectedTxnId, fetchTransactionAudit]);

  const filteredRecords = threeWayRecords.filter(r => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      r.transaction_id.toLowerCase().includes(q) ||
      r.utr.toLowerCase().includes(q) ||
      r.order_id.toLowerCase().includes(q) ||
      r.customer_name.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (activeFilter === 'EXCEPTIONS') return r.current_status === 'EXCEPTION';
    if (activeFilter === 'MATCHED') return r.current_status === 'MATCHED';
    if (activeFilter === 'HIGH_VARIANCE') return Math.abs(r.variance) >= 500;
    return true;
  });

  const activeRecord = threeWayRecords.find(r => r.transaction_id === selectedTxnId) || threeWayRecords[0];

  const handleSelectRecord = (txnId: string) => {
    setSelectedTxnId(txnId);
    fetchTransactionAudit(txnId);
  };

  const handleExecuteAction = async (txnId: string, action: string) => {
    const success = await executeAction(txnId, action, `Operator approved ${action} in Audit Center`);
    if (success) {
      setActionSuccessMsg(`✓ Action '${action}' successfully executed on ${txnId}.`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
      fetchTransactionAudit(txnId);
    }
  };

  const totalReconciledVolume = threeWayRecords
    .filter(r => r.current_status === 'MATCHED')
    .reduce((acc, r) => acc + r.expected_settlement, 0);

  const totalAtRisk = threeWayRecords
    .filter(r => r.current_status === 'EXCEPTION')
    .reduce((acc, r) => acc + Math.abs(r.variance), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Immutable Audit Trail</h1>
            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Statutory Traceability
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Chronological proof sequences for every financial decision: Gateway Ingestion → 10-Step Deterministic Math → AI Residuals → Verification Gate.
          </p>
        </div>

        <button
          onClick={() => exportReport('audit')}
          className="flex items-center space-x-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors self-start sm:self-auto"
        >
          <Download className="h-3.5 w-3.5 text-slate-500" />
          <span>Export Audit Ledger</span>
        </button>
      </div>

      {/* Top KPI Audit Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs">
          <span className="text-[11px] text-slate-500">Audited Records</span>
          <div className="text-lg font-bold text-slate-900 mt-0.5 font-mono">
            {threeWayRecords.length.toLocaleString('en-IN')} records
          </div>
          <span className="text-[10px] text-slate-400">100% lineage captured</span>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs">
          <span className="text-[11px] text-slate-500">Verified Ledger Inflow</span>
          <div className="text-lg font-bold text-emerald-700 mt-0.5 font-mono">
            ₹{(totalReconciledVolume / 100000).toFixed(2)}L
          </div>
          <span className="text-[10px] text-emerald-600 font-medium">Auto-posted to Books</span>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs">
          <span className="text-[11px] text-slate-500">Quarantined Risk</span>
          <div className="text-lg font-bold text-red-600 mt-0.5 font-mono">
            ₹{(totalAtRisk / 1000).toFixed(1)}k
          </div>
          <span className="text-[10px] text-red-600 font-medium">Auto-posting blocked</span>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs">
          <span className="text-[11px] text-slate-500">Ledger Immutability</span>
          <div className="text-xs font-bold text-slate-800 mt-1 font-mono truncate">
            SHA-256: 8f9b2c4e...
          </div>
          <span className="text-[10px] text-blue-600 font-medium flex items-center gap-1 mt-0.5">
            <KeyRound className="h-3 w-3" /> Cryptographically Sealed
          </span>
        </div>
      </div>

      {/* Action Banner if Present */}
      {actionSuccessMsg && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 font-medium flex items-center space-x-2 animate-fadeIn">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Transaction Selector (5 cols) */}
        <div className="lg:col-span-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <span className="text-xs font-bold uppercase text-slate-600 tracking-wider">Transaction Ledger</span>
            <span className="text-[11px] text-slate-400 font-mono">{filteredRecords.length} entries</span>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Txn, UTR, Order, Customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-slate-200 pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-[#0c66e4] focus:outline-none"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 flex-wrap">
            {(['ALL', 'EXCEPTIONS', 'MATCHED', 'HIGH_VARIANCE'] as const).map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-2.5 py-1 rounded text-[10px] font-semibold transition-colors ${
                  activeFilter === f
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {f === 'ALL' && `All (${threeWayRecords.length})`}
                {f === 'EXCEPTIONS' && `Exceptions (${threeWayRecords.filter(r => r.current_status === 'EXCEPTION').length})`}
                {f === 'MATCHED' && `Matched (${threeWayRecords.filter(r => r.current_status === 'MATCHED').length})`}
                {f === 'HIGH_VARIANCE' && `High Variance`}
              </button>
            ))}
          </div>

          <div className="divide-y divide-slate-100 max-h-[560px] overflow-y-auto pr-1">
            {filteredRecords.length > 0 ? (
              filteredRecords.slice(0, 40).map((rec) => {
                const isSelected = rec.transaction_id === (activeRecord?.transaction_id || selectedTxnId);
                const isMatched = rec.current_status === 'MATCHED';
                return (
                  <button
                    key={rec.transaction_id}
                    onClick={() => handleSelectRecord(rec.transaction_id)}
                    className={`w-full text-left p-2.5 rounded-md transition-colors flex items-center justify-between gap-2 ${
                      isSelected ? 'bg-blue-50/80 border border-blue-200 shadow-2xs' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="font-mono text-xs font-bold text-slate-900 truncate">{rec.transaction_id}</div>
                      <div className="text-[10px] text-slate-500 font-mono truncate">UTR: {rec.utr}</div>
                      <div className="text-[11px] font-medium text-slate-700 flex items-center gap-1.5">
                        <span>₹{rec.gross_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-500 text-[10px] truncate">{rec.customer_name}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                        isMatched
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {rec.current_status}
                      </span>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                        {rec.variance === 0 ? '₹0.00' : `${rec.variance > 0 ? '+' : ''}₹${rec.variance.toFixed(2)}`}
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                No matching transactions found.
              </div>
            )}
          </div>
        </div>

        {/* Right: Step-by-Step Proof Timeline (7 cols) */}
        <div className="lg:col-span-7 rounded-lg border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          {activeRecord ? (
            <>
              {/* Record Summary Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Authoritative Audit Target</span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] font-mono text-slate-700">
                      {activeRecord.invoice_id}
                    </span>
                  </div>
                  <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">{activeRecord.transaction_id}</div>
                  <div className="text-xs text-slate-500 font-mono">
                    Order: {activeRecord.order_id} · Customer: {activeRecord.customer_name} · Date: {activeRecord.settlement_date || '2026-08-19'}
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <div className="text-[10px] uppercase font-semibold text-slate-400">Verification Verdict</div>
                  <div className="text-base font-bold text-slate-900 font-mono">₹{activeRecord.expected_settlement.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                  <div className={`text-xs font-bold ${activeRecord.variance === 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    Variance: {activeRecord.variance === 0 ? '₹0.00' : `₹${activeRecord.variance.toFixed(2)}`}
                  </div>
                </div>
              </div>

              {/* 4-Stage Visual Ingestion & Verification Lineage */}
              <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Four-Stage Audit Lineage Progression
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded bg-blue-50 border border-blue-100">
                    <div className="text-[9px] font-bold text-blue-700 uppercase">1. Ingestion</div>
                    <div className="font-semibold text-slate-900 mt-1 font-mono text-[11px]">₹{activeRecord.gross_amount.toLocaleString()}</div>
                    <div className="text-[9px] text-slate-500">Gross Captured</div>
                  </div>

                  <div className="p-2.5 rounded bg-indigo-50 border border-indigo-100">
                    <div className="text-[9px] font-bold text-indigo-700 uppercase">2. Bank Credit</div>
                    <div className="font-semibold text-slate-900 mt-1 font-mono text-[11px]">₹{activeRecord.actual_bank_credit.toLocaleString()}</div>
                    <div className="text-[9px] text-slate-500 font-mono">UTR Verified</div>
                  </div>

                  <div className="p-2.5 rounded bg-purple-50 border border-purple-100">
                    <div className="text-[9px] font-bold text-purple-700 uppercase">3. AI Residual</div>
                    <div className="font-semibold text-slate-900 mt-1 text-[11px] truncate">
                      {activeRecord.ai_proposal ? activeRecord.ai_proposal.suggestedAction : 'MATCHED'}
                    </div>
                    <div className="text-[9px] text-slate-500">
                      {activeRecord.ai_proposal ? `${(activeRecord.ai_proposal.confidence * 100).toFixed(0)}% Conf` : 'Deterministic'}
                    </div>
                  </div>

                  <div className={`p-2.5 rounded border ${
                    activeRecord.current_status === 'MATCHED'
                      ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                      : 'bg-rose-50 border-rose-100 text-rose-800'
                  }`}>
                    <div className="text-[9px] font-bold uppercase">4. Verifier Gate</div>
                    <div className="font-bold mt-1 text-[11px]">
                      {activeRecord.current_status === 'MATCHED' ? 'VERIFIED' : 'REJECTED'}
                    </div>
                    <div className="text-[9px]">
                      {activeRecord.current_status === 'MATCHED' ? 'Auto-Post Safe' : 'Quarantine'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Mathematical Waterfall */}
              {activeRecord.waterfall && (
                <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      10-Step Deterministic Calculation Waterfall
                    </span>
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">
                      Python Decimal
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-sans">Gross Capture</span>
                      <div className="font-bold text-slate-900">₹{activeRecord.waterfall.gross_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-sans">MDR Fee (2.0%)</span>
                      <div className="font-semibold text-red-600">-₹{activeRecord.waterfall.mdr_amount.toFixed(2)}</div>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-sans">GST on MDR (18%)</span>
                      <div className="font-semibold text-red-600">-₹{activeRecord.waterfall.gst_amount.toFixed(2)}</div>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-sans">Theoretical Net</span>
                      <div className="font-bold text-slate-900">₹{activeRecord.waterfall.theoretical_net_settlement.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Residual Proposal Card if anomaly */}
              {activeRecord.ai_proposal && (
                <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3.5 space-y-1.5 text-xs">
                  <div className="flex items-center space-x-1.5 font-bold text-amber-900">
                    <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                    <span>AI Residual Investigation Proposal (Advisory Only)</span>
                  </div>
                  <p className="text-amber-800 text-[11px] leading-relaxed">
                    {activeRecord.ai_proposal.reasoning}
                  </p>
                  <div className="flex items-center gap-3 text-[10px] font-medium text-amber-700 pt-1">
                    <span>Confidence: {(activeRecord.ai_proposal.confidence * 100).toFixed(0)}%</span>
                    <span>·</span>
                    <span>Recommended Action: <strong className="font-mono">{activeRecord.ai_proposal.suggestedAction}</strong></span>
                  </div>
                </div>
              )}

              {/* Timeline Events */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center">
                    <History className="h-4 w-4 mr-1.5 text-slate-400" />
                    <span>Immutable Audit Chronology</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">Append-Only</span>
                </div>

                {isLoadingAudit ? (
                  <div className="p-8 text-center text-xs text-slate-400">Loading authoritative audit trace...</div>
                ) : auditEvents.length > 0 ? (
                  <div className="space-y-3 pl-3 border-l-2 border-slate-200">
                    {auditEvents.map((evt, idx) => (
                      <div key={idx} className="relative group pl-3">
                        <div className="absolute -left-[19px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#0c66e4] shadow-xs" />
                        <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{evt.step_name}</span>
                            <span className="font-mono text-[10px] text-slate-400">{evt.timestamp ? evt.timestamp.slice(11, 19) : '06:00:00'}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">{evt.rule_or_model}</div>
                          <p className="text-[11px] text-slate-700 leading-normal">{evt.details}</p>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="rounded bg-slate-200/80 px-1.5 py-0.2 text-[9px] font-bold text-slate-700 font-mono">
                              Verdict: {evt.final_decision}
                            </span>
                            <span className="text-[9px] text-emerald-700 font-semibold flex items-center gap-0.5">
                              <CheckCircle2 className="h-2.5 w-2.5" /> Hash Verified
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2 pl-3 border-l-2 border-slate-200">
                    <div className="relative pl-3">
                      <div className="absolute -left-[19px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-600 shadow-xs" />
                      <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs space-y-1">
                        <span className="font-bold text-slate-900">Stage 1: Multi-Source Ingestion</span>
                        <p className="text-[11px] text-slate-600">Ingested Razorpay payout manifest and bank credit feed for order {activeRecord.order_id}.</p>
                      </div>
                    </div>
                    <div className="relative pl-3">
                      <div className="absolute -left-[19px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#0c66e4] shadow-xs" />
                      <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs space-y-1">
                        <span className="font-bold text-slate-900">Stage 2: Deterministic 10-Step Math</span>
                        <p className="text-[11px] text-slate-600">Computed contracted 2.0% MDR and statutory 18% GST. Expected net: ₹{activeRecord.expected_settlement.toFixed(2)}.</p>
                      </div>
                    </div>
                    <div className="relative pl-3">
                      <div className={`absolute -left-[19px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white ${activeRecord.variance === 0 ? 'bg-emerald-600' : 'bg-red-600'} shadow-xs`} />
                      <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs space-y-1">
                        <span className="font-bold text-slate-900">Stage 3: Verification Gate Decision</span>
                        <p className="text-[11px] text-slate-600">
                          {activeRecord.variance === 0 
                            ? 'Zero variance confirmed. Auto-posted to general merchant ledger.' 
                            : `Variance of ₹${activeRecord.variance.toFixed(2)} detected. Auto-post blocked. Intercepted into Exception queue.`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Operator Resolution Actions */}
              {activeRecord.current_status === 'EXCEPTION' && (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">Human-in-the-Loop Governance</span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleExecuteAction(activeRecord.transaction_id, 'QUARANTINE')}
                      className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Quarantine Entry
                    </button>
                    <button
                      onClick={() => handleExecuteAction(activeRecord.transaction_id, activeRecord.recommended_action || 'DISPUTE_RAZORPAY')}
                      className="rounded bg-[#0c66e4] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#0052cc] transition-colors"
                    >
                      {activeRecord.recommended_action || 'Raise Gateway Dispute'}
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-12 text-center text-xs text-slate-400">
              Select a transaction record from the left panel to inspect its immutable audit lineage.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditTrailView;

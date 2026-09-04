import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { 
  RotateCw, 
  Search, 
  Filter, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  ArrowRight, 
  ShieldCheck, 
  AlertTriangle, 
  ExternalLink, 
  ChevronRight, 
  ChevronUp, 
  ChevronDown, 
  SlidersHorizontal, 
  X, 
  FileCheck2, 
  FileText, 
  Scale, 
  Layers,
  Sparkles,
  Download,
  Zap
} from 'lucide-react';
import { ThreeWayReconciliationRecord } from '../../types';

export const ReconciliationCenter: React.FC = () => {
  const { 
    threeWayRecords, 
    metrics, 
    isReconciling, 
    runReconciliationBatch, 
    executeAction,
    exportReport,
    fetchTransactionAudit,
    auditEvents,
    isLoadingAudit
  } = useFinance();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'MATCHED' | 'EXCEPTIONS' | 'HIGH_VARIANCE' | 'AI_PROPOSED'>('ALL');
  const [selectedRecord, setSelectedRecord] = useState<ThreeWayReconciliationRecord | null>(null);
  const [showAuditTrail, setShowAuditTrail] = useState(true);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const filteredRecords = threeWayRecords.filter(r => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      r.order_id.toLowerCase().includes(q) ||
      r.transaction_id.toLowerCase().includes(q) ||
      r.customer_name.toLowerCase().includes(q) ||
      r.utr.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (selectedFilter === 'MATCHED') return r.current_status === 'MATCHED';
    if (selectedFilter === 'EXCEPTIONS') return r.current_status === 'EXCEPTION';
    if (selectedFilter === 'HIGH_VARIANCE') return Math.abs(r.variance) >= 500;
    if (selectedFilter === 'AI_PROPOSED') return r.match_method === 'AI_SEMANTIC' || r.current_status === 'AI_PROPOSED';
    return true;
  });

  const handleSelectRecord = (rec: ThreeWayReconciliationRecord) => {
    setSelectedRecord(rec);
    fetchTransactionAudit(rec.transaction_id);
  };

  const handleAction = async (txnId: string, action: string) => {
    const success = await executeAction(txnId, action, `Manual resolution: ${action}`);
    if (success) {
      setActionSuccessMessage(`Action '${action}' successfully executed on ${txnId}.`);
      setTimeout(() => setActionSuccessMessage(null), 4000);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">3-Way Reconciliation Workspace</h1>
            <span className="rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-xs font-semibold text-[#0c66e4]">
              Deterministic Engine
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Reconciling Razorpay Settlement Manifests, Bank Credits, and Merchant Ledger Invoices with paise-level precision.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={exportReport}
            className="inline-flex items-center space-x-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Statement</span>
          </button>
          
          <button
            onClick={() => runReconciliationBatch(1000)}
            disabled={isReconciling}
            className="inline-flex items-center space-x-1.5 rounded-md bg-[#0c66e4] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#0052cc] transition-colors disabled:opacity-50"
          >
            <RotateCw className={`h-3.5 w-3.5 ${isReconciling ? 'animate-spin' : ''}`} />
            <span>{isReconciling ? 'Reconciling...' : 'Run 1,000-Record Reconciliation'}</span>
          </button>
        </div>
      </div>

      {/* Action Notification */}
      {actionSuccessMessage && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{actionSuccessMessage}</span>
          </div>
          <button onClick={() => setActionSuccessMessage(null)} className="text-slate-400 hover:text-slate-600">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-1.5 w-full sm:w-auto flex-wrap gap-y-1.5">
          {(['ALL', 'MATCHED', 'EXCEPTIONS', 'HIGH_VARIANCE', 'AI_PROPOSED'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                selectedFilter === filter
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {filter === 'ALL' && `All (${threeWayRecords.length})`}
              {filter === 'MATCHED' && `Matched (${threeWayRecords.filter(r => r.current_status === 'MATCHED').length})`}
              {filter === 'EXCEPTIONS' && `Exceptions (${threeWayRecords.filter(r => r.current_status === 'EXCEPTION').length})`}
              {filter === 'HIGH_VARIANCE' && `High Variance (${threeWayRecords.filter(r => Math.abs(r.variance) >= 500).length})`}
              {filter === 'AI_PROPOSED' && `AI Residuals (${threeWayRecords.filter(r => r.match_method === 'AI_SEMANTIC').length})`}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Txn, UTR, Customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-slate-200 pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-[#0c66e4] focus:outline-none"
          />
        </div>
      </div>

      {/* 3-Way Reconciliation Master Table */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 font-semibold text-slate-600">
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Transaction / UTR</th>
                <th className="py-3 px-4">Order / Invoice</th>
                <th className="py-3 px-4 text-right">Gross</th>
                <th className="py-3 px-4 text-right">Fees (MDR+GST)</th>
                <th className="py-3 px-4 text-right">Expected</th>
                <th className="py-3 px-4 text-right">Bank Credit</th>
                <th className="py-3 px-4 text-right">Variance</th>
                <th className="py-3 px-4">Match Method</th>
                <th className="py-3 px-4">Verifier Gate</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.slice(0, 50).map((r) => {
                const isMatched = r.current_status === 'MATCHED';
                const isException = r.current_status === 'EXCEPTION';
                const isVerified = r.verification_status === 'VERIFIED';

                return (
                  <tr
                    key={r.transaction_id}
                    onClick={() => handleSelectRecord(r)}
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        isMatched
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-red-50 text-red-700'
                      }`}>
                        {r.current_status}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-mono font-medium text-slate-900">{r.transaction_id}</div>
                      <div className="font-mono text-[10px] text-slate-400">UTR: {r.utr}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-slate-800">{r.order_id}</div>
                      <div className="text-[10px] text-slate-400">{r.customer_name}</div>
                    </td>

                    <td className="py-3 px-4 text-right font-medium text-slate-900">
                      ₹{r.gross_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3 px-4 text-right text-red-600 font-mono">
                      -₹{(r.mdr + r.gst_on_mdr).toFixed(2)}
                    </td>

                    <td className="py-3 px-4 text-right font-semibold text-slate-900">
                      ₹{r.expected_settlement.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3 px-4 text-right font-medium text-slate-800">
                      ₹{r.actual_bank_credit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3 px-4 text-right font-bold">
                      {r.variance === 0 ? (
                        <span className="text-emerald-600">₹0.00</span>
                      ) : (
                        <span className="text-red-600 font-mono">
                          {r.variance > 0 ? `+₹${r.variance.toFixed(2)}` : `-₹${Math.abs(r.variance).toFixed(2)}`}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span className="inline-block rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                        {r.match_method}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center space-x-1 text-[11px] font-semibold ${
                        isVerified ? 'text-emerald-700' : 'text-red-600'
                      }`}>
                        {isVerified ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 mr-1" />
                            VERIFIED
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="h-3.5 w-3.5 text-red-600 mr-1" />
                            REJECTED
                          </>
                        )}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      {isException ? (
                        <button
                          onClick={() => handleAction(r.transaction_id, r.recommended_action || 'DISPUTE_RAZORPAY')}
                          className="rounded bg-red-600 px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-red-700 transition-colors"
                        >
                          {r.recommended_action || 'Resolve'}
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reconciliation Detail Drawer Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-fadeIn">
          <div className="w-full max-w-xl bg-white shadow-2xl h-full flex flex-col justify-between overflow-y-auto">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Reconciliation Audit Voucher
                  </span>
                  <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-mono text-slate-700">
                    {selectedRecord.invoice_id}
                  </span>
                </div>
                <div className="text-base font-bold text-slate-900 font-mono mt-0.5">
                  {selectedRecord.transaction_id}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className={`rounded px-2 py-0.5 text-xs font-semibold ${
                  selectedRecord.current_status === 'MATCHED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {selectedRecord.current_status}
                </span>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="rounded-md p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Drawer Content */}
            <div className="p-6 space-y-6 flex-1">
              {/* 3-Way Reconciliation Visual Progression */}
              <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Three-Way Ingestion Lineage
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded bg-blue-50 border border-blue-100">
                    <div className="text-[10px] font-semibold text-blue-700 uppercase">1. Razorpay</div>
                    <div className="font-semibold text-slate-900 mt-1">₹{selectedRecord.gross_amount.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-500 font-mono">Order: {selectedRecord.order_id}</div>
                  </div>

                  <div className="p-2.5 rounded bg-indigo-50 border border-indigo-100">
                    <div className="text-[10px] font-semibold text-indigo-700 uppercase">2. Bank Credit</div>
                    <div className="font-semibold text-slate-900 mt-1">₹{selectedRecord.actual_bank_credit.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-500 font-mono">UTR: {selectedRecord.utr}</div>
                  </div>

                  <div className="p-2.5 rounded bg-slate-100 border border-slate-200">
                    <div className="text-[10px] font-semibold text-slate-700 uppercase">3. Merchant Ledger</div>
                    <div className="font-semibold text-slate-900 mt-1">₹{selectedRecord.expected_settlement.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-500 font-mono">Inv: {selectedRecord.invoice_id}</div>
                  </div>
                </div>
              </div>

              {/* Strict Decimal Arithmetic Waterfall */}
              {selectedRecord.waterfall && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2.5">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
                    <span>10-Step Deterministic Calculation</span>
                    <span className="text-[10px] font-mono text-slate-400">Decimal (Paise-Accurate)</span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-700">
                      <span>Gross Capture:</span>
                      <span className="font-semibold">₹{selectedRecord.waterfall.gross_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>Contracted MDR (2.0%):</span>
                      <span>-₹{selectedRecord.waterfall.mdr_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>Statutory GST on MDR (18%):</span>
                      <span>-₹{selectedRecord.waterfall.gst_amount.toFixed(2)}</span>
                    </div>
                    {selectedRecord.refund > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Customer Refund:</span>
                        <span>-₹{selectedRecord.refund.toFixed(2)}</span>
                      </div>
                    )}
                    {selectedRecord.chargeback > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Chargeback Reserve:</span>
                        <span>-₹{selectedRecord.chargeback.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-200">
                      <span>Theoretical Net Settlement:</span>
                      <span>₹{selectedRecord.waterfall.theoretical_net_settlement.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-800">
                      <span>Actual Bank Payout:</span>
                      <span className="font-semibold">₹{selectedRecord.actual_bank_credit.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-base pt-1">
                      <span>Discrepancy Variance:</span>
                      <span className={selectedRecord.variance === 0 ? 'text-emerald-600' : 'text-red-600'}>
                        ₹{selectedRecord.variance.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Proposal Card (if applicable) */}
              {selectedRecord.ai_proposal && (
                <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-bold text-amber-900">
                    <Sparkles className="h-4 w-4 text-amber-600" />
                    <span>AI Residual Proposal (Unapproved)</span>
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    {selectedRecord.ai_proposal.reasoning}
                  </p>
                  <div className="text-[11px] text-slate-500">
                    Confidence: {(selectedRecord.ai_proposal.confidence * 100).toFixed(0)}% · Action: {selectedRecord.ai_proposal.suggestedAction}
                  </div>
                </div>
              )}

              {/* Verifier Proof Results */}
              {selectedRecord.verification_result && (
                <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Deterministic Verification Checks
                  </div>
                  <div className="space-y-1 text-xs">
                    {selectedRecord.verification_result.checksPassed.map((c, i) => (
                      <div key={i} className="text-emerald-700 flex items-center space-x-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>{c}</span>
                      </div>
                    ))}
                    {selectedRecord.verification_result.checksFailed.map((c, i) => (
                      <div key={i} className="text-red-700 flex items-center space-x-1.5">
                        <AlertTriangle className="h-3.5 w-3.5 text-red-600 shrink-0" />
                        <span>{c}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Rule: {selectedRecord.match_method}
              </span>

              {selectedRecord.current_status === 'EXCEPTION' && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      handleAction(selectedRecord.transaction_id, 'QUARANTINE');
                      setSelectedRecord(null);
                    }}
                    className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Quarantine
                  </button>
                  <button
                    onClick={() => {
                      handleAction(selectedRecord.transaction_id, selectedRecord.recommended_action || 'DISPUTE_RAZORPAY');
                      setSelectedRecord(null);
                    }}
                    className="rounded bg-[#0c66e4] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#0052cc]"
                  >
                    {selectedRecord.recommended_action || 'Create Dispute'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

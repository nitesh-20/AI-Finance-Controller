import React, { useState } from 'react';
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
  ArrowRight
} from 'lucide-react';

export const AuditTrailView: React.FC = () => {
  const { threeWayRecords, auditEvents, fetchTransactionAudit, isLoadingAudit } = useFinance();
  const [selectedTxnId, setSelectedTxnId] = useState<string>(
    threeWayRecords.length > 0 ? threeWayRecords[0].transaction_id : ''
  );
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRecords = threeWayRecords.filter(r => 
    r.transaction_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.utr.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.order_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeRecord = threeWayRecords.find(r => r.transaction_id === selectedTxnId);

  const handleSelectRecord = (txnId: string) => {
    setSelectedTxnId(txnId);
    fetchTransactionAudit(txnId);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center space-x-2.5">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Immutable Audit Trail</h1>
          <span className="rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
            Statutory Traceability
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Chronological proof sequences for every decision: Ingestion → Deterministic Matching → AI Residuals → Verification Gate.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Transaction Selector */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Txn, UTR, Order..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-slate-200 pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-[#0c66e4] focus:outline-none"
            />
          </div>

          <div className="divide-y divide-slate-100 max-h-[550px] overflow-y-auto">
            {filteredRecords.slice(0, 30).map((rec) => {
              const isSelected = rec.transaction_id === selectedTxnId;
              return (
                <button
                  key={rec.transaction_id}
                  onClick={() => handleSelectRecord(rec.transaction_id)}
                  className={`w-full text-left p-2.5 rounded-md transition-colors flex items-center justify-between ${
                    isSelected ? 'bg-blue-50/80 border border-blue-200' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="font-mono text-xs font-semibold text-slate-900">{rec.transaction_id}</div>
                    <div className="text-[11px] text-slate-500 font-mono">UTR: {rec.utr}</div>
                    <div className="text-[11px] font-medium text-slate-700">Gross: ₹{rec.gross_amount.toLocaleString()}</div>
                  </div>

                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    rec.current_status === 'MATCHED'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-red-50 text-red-700'
                  }`}>
                    {rec.current_status}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Step-by-Step Proof Timeline */}
        <div className="lg:col-span-2 rounded-lg border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          {activeRecord ? (
            <>
              {/* Record Summary Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase">Audit Target</div>
                  <div className="text-base font-bold text-slate-900 font-mono">{activeRecord.transaction_id}</div>
                  <div className="text-xs text-slate-500">Order: {activeRecord.order_id} · Invoice: {activeRecord.invoice_id}</div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-500">Expected Settlement</div>
                  <div className="text-base font-bold text-slate-900">₹{activeRecord.expected_settlement.toLocaleString()}</div>
                  <div className={`text-xs font-semibold ${activeRecord.variance === 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    Variance: ₹{activeRecord.variance.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Mathematical Waterfall */}
              {activeRecord.waterfall && (
                <div className="rounded-md border border-slate-100 bg-slate-50 p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Deterministic Financial Arithmetic Proof (Decimal Precision)
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500">Gross Amount:</span>
                      <div className="font-semibold text-slate-900">₹{activeRecord.waterfall.gross_amount.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-slate-500">MDR (2.0%):</span>
                      <div className="font-semibold text-red-600">-₹{activeRecord.waterfall.mdr_amount.toFixed(2)}</div>
                    </div>
                    <div>
                      <span className="text-slate-500">GST on MDR (18%):</span>
                      <div className="font-semibold text-red-600">-₹{activeRecord.waterfall.gst_amount.toFixed(2)}</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Net Expected:</span>
                      <div className="font-semibold text-emerald-700">₹{activeRecord.waterfall.theoretical_net_settlement.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Timeline Events */}
              <div className="space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center">
                  <History className="h-4 w-4 mr-1.5 text-slate-400" />
                  Chronological Proof Events
                </div>

                {isLoadingAudit ? (
                  <div className="p-8 text-center text-xs text-slate-400">Loading audit trace...</div>
                ) : auditEvents.length > 0 ? (
                  <div className="space-y-4 pl-4 border-l-2 border-slate-200">
                    {auditEvents.map((evt, idx) => (
                      <div key={idx} className="relative group">
                        <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-blue-600 shadow-sm" />
                        <div className="rounded-md border border-slate-100 bg-slate-50/70 p-3 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-900">{evt.step_name}</span>
                            <span className="font-mono text-[10px] text-slate-400">{evt.timestamp.slice(11, 19)}</span>
                          </div>
                          <div className="text-[11px] text-slate-600 font-mono">{evt.rule_or_model}</div>
                          <p className="text-[11px] text-slate-700 leading-normal">{evt.details}</p>
                          <div className="mt-1 inline-block rounded bg-slate-200/80 px-2 py-0.5 text-[10px] font-semibold text-slate-800">
                            Decision: {evt.final_decision}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-md">
                    Select a transaction to inspect its cryptographic audit steps.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-xs text-slate-400">
              Select a transaction record from the left panel.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

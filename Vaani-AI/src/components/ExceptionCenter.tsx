import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { 
  AlertTriangle, 
  FileText, 
  X, 
  CheckCircle2, 
  Scale, 
  ArrowUpDown,
  Filter,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { FinancialException, ExceptionStatus } from '../types';

export const ExceptionCenter: React.FC = () => {
  const { 
    exceptions, 
    selectedExceptionId, 
    setSelectedExceptionId, 
    updateExceptionStatus,
    exportReport 
  } = useFinance();

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'UNRESOLVED' | 'RESOLVED'>('ALL');
  const [sortBy, setSortBy] = useState<'VARIANCE' | 'CONFIDENCE' | 'SEVERITY' | 'DATE'>('VARIANCE');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const filteredExceptions = exceptions
    .filter(e => {
      if (activeFilter === 'ALL') return true;
      if (activeFilter === 'CRITICAL') return e.severity === 'CRITICAL';
      if (activeFilter === 'HIGH') return e.severity === 'HIGH';
      if (activeFilter === 'MEDIUM') return e.severity === 'MEDIUM';
      if (activeFilter === 'LOW') return e.severity === 'LOW';
      if (activeFilter === 'UNRESOLVED') return e.status !== 'RESOLVED';
      if (activeFilter === 'RESOLVED') return e.status === 'RESOLVED';
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'VARIANCE') return b.difference - a.difference;
      if (sortBy === 'SEVERITY') {
        const order: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        return (order[b.severity] || 0) - (order[a.severity] || 0);
      }
      if (sortBy === 'DATE') return new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime();
      return b.difference - a.difference;
    });

  const selectedException = exceptions.find(e => e.id === selectedExceptionId) || null;

  const handleAction = (status: ExceptionStatus, noteText: string) => {
    if (!selectedException) return;
    updateExceptionStatus(selectedException.id, status, noteText);
    setActionSuccessMessage(`✓ Exception ${selectedException.exceptionCode} updated to ${status}.`);
    setResolutionNotes('');
    setTimeout(() => setActionSuccessMessage(null), 3000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Exceptions &amp; Root-Cause Diagnostics</h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Review, isolate, dispute, and resolve transaction exceptions surfaced by the AI Transaction Auditor.
          </p>
        </div>

        <button
          onClick={() => exportReport('exceptions')}
          className="flex items-center space-x-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <FileText className="h-3.5 w-3.5 text-slate-500" />
          <span>Export Exception Report</span>
        </button>
      </div>

      {/* Action Banner if Present */}
      {actionSuccessMessage && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 font-medium flex items-center space-x-2 animate-fadeIn">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* Filter & Sorting Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1 text-xs">
          {[
            { id: 'ALL', label: `All (${exceptions.length})` },
            { id: 'CRITICAL', label: `Critical (${exceptions.filter(e => e.severity === 'CRITICAL').length})` },
            { id: 'HIGH', label: `High (${exceptions.filter(e => e.severity === 'HIGH').length})` },
            { id: 'MEDIUM', label: `Medium (${exceptions.filter(e => e.severity === 'MEDIUM').length})` },
            { id: 'UNRESOLVED', label: 'Unresolved' },
            { id: 'RESOLVED', label: 'Resolved' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`rounded-md px-2.5 py-1.5 font-medium transition-colors ${
                activeFilter === tab.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sort Controls */}
        <div className="flex items-center space-x-1.5 text-xs">
          <span className="text-slate-400">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-[#0c66e4] focus:outline-none"
          >
            <option value="VARIANCE">Variance (Highest First)</option>
            <option value="SEVERITY">Severity</option>
            <option value="DATE">Detected Date</option>
          </select>
        </div>
      </div>

      {/* Exceptions Operations Queue Table */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500">
              <tr>
                <th className="py-2.5 px-3">Exception Code</th>
                <th className="py-2.5 px-3">Transaction</th>
                <th className="py-2.5 px-3">Diagnosed Root Cause</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3 text-right">Variance</th>
                <th className="py-2.5 px-3">Recommended Action</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredExceptions.map(exc => {
                const isResolved = exc.status === 'RESOLVED';

                return (
                  <tr
                    key={exc.id}
                    onClick={() => setSelectedExceptionId(exc.id)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                      {exc.exceptionCode}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-700">
                      {exc.transactionId}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">
                      {exc.type.replace(/_/g, ' ')}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        exc.severity === 'CRITICAL'
                          ? 'bg-red-50 text-red-700'
                          : exc.severity === 'HIGH'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {exc.severity}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-red-700">
                      ₹{exc.difference.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-mono text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {exc.suggestedAction?.includes('dispute') ? 'DISPUTE_RAZORPAY' : (exc.suggestedAction?.includes('refund') ? 'REFUND_DUPLICATE' : 'JOURNAL_ADJUSTMENT')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex items-center space-x-1 text-[11px] ${
                        isResolved ? 'text-emerald-700 font-medium' : 'text-slate-600'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          isResolved ? 'bg-emerald-600' : 'bg-red-500'
                        }`} />
                        <span>{exc.status}</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="inline-flex items-center space-x-0.5 text-[11px] font-medium text-[#0c66e4] hover:underline">
                        <span>Investigate</span>
                        <ArrowRight className="h-3 w-3" />
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Exception Detail & Evidence Drawer */}
      {selectedException && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30 backdrop-blur-xs">
          <div className="h-full w-full max-w-md bg-white p-6 shadow-2xl border-l border-slate-200 overflow-y-auto space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs text-slate-400 font-medium">{selectedException.exceptionCode}</span>
                <div className="text-sm font-bold text-slate-900 mt-0.5">
                  {selectedException.type.replace(/_/g, ' ')}
                </div>
              </div>
              <button
                onClick={() => setSelectedExceptionId(null)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Financial Amounts Summary */}
            <div className="rounded-lg bg-slate-50 p-4 border border-slate-200 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-600">
                <span>Expected Net Settlement:</span>
                <span className="font-medium text-slate-900">₹{selectedException.expectedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Actual Bank Credit:</span>
                <span className="font-bold text-red-700">₹{selectedException.actualAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-red-700 text-sm">
                <span>Variance Difference:</span>
                <span>-₹{selectedException.difference.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Reason / AI Explanation */}
            <div className="space-y-1.5 text-xs">
              <div className="font-semibold text-slate-900">AI Root-Cause Diagnosis</div>
              <p className="text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed">
                {selectedException.aiExplanation}
              </p>
            </div>

            {/* Evidence Summary */}
            <div className="space-y-2 text-xs">
              <div className="font-semibold text-slate-900">Evidence Trail</div>
              <div className="rounded-lg border border-slate-200 p-3 space-y-1.5 text-slate-600 text-[11px] font-mono">
                <div className="flex justify-between">
                  <span>Order Reference:</span>
                  <span className="text-slate-900">{selectedException.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Transaction ID:</span>
                  <span className="text-slate-900">{selectedException.transactionId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Settlement Batch:</span>
                  <span className="text-slate-900">{selectedException.settlementId || 'Pending release'}</span>
                </div>
              </div>
            </div>

            {/* Resolution Actions */}
            <div className="space-y-3 pt-2">
              <textarea
                rows={2}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Add audit resolution notes..."
                className="w-full rounded-md border border-slate-200 bg-white p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-[#0c66e4] focus:outline-none"
              />

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleAction('RESOLVED', resolutionNotes || 'Resolved clean via audit adjustment')}
                  className="rounded-md bg-[#0c66e4] py-2 text-xs font-semibold text-white hover:bg-[#0052cc] transition-colors"
                >
                  Mark as Resolved
                </button>
                <button
                  onClick={() => handleAction('INVESTIGATING', resolutionNotes || 'Dispute escalated to gateway')}
                  className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Escalate Dispute
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

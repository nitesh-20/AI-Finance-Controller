import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { 
  AlertTriangle, 
  FileText, 
  X, 
  CheckCircle2, 
  Scale, 
  ArrowUpDown, 
  Filter, 
  ShieldAlert, 
  ArrowRight, 
  SlidersHorizontal, 
  Layers, 
  Sparkles, 
  ExternalLink,
  Search,
  Download,
  ShieldCheck,
  Check
} from 'lucide-react';
import { FinancialException, ExceptionStatus } from '../../types';

export const ExceptionCenter: React.FC = () => {
  const { 
    exceptions, 
    selectedExceptionId, 
    setSelectedExceptionId, 
    updateExceptionStatus,
    executeAction,
    exportReport 
  } = useFinance();

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'UNRESOLVED' | 'RESOLVED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'VARIANCE' | 'CONFIDENCE' | 'SEVERITY' | 'DATE'>('VARIANCE');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const filteredExceptions = exceptions
    .filter(e => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        e.exceptionCode.toLowerCase().includes(q) ||
        e.transactionId.toLowerCase().includes(q) ||
        (e.orderId && e.orderId.toLowerCase().includes(q)) ||
        (e.customerName && e.customerName.toLowerCase().includes(q)) ||
        (e.type && e.type.toLowerCase().includes(q));

      if (!matchesSearch) return false;

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
      if (sortBy === 'CONFIDENCE') return (b.aiConfidence || 0) - (a.aiConfidence || 0);
      if (sortBy === 'SEVERITY') {
        const order: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        return (order[b.severity] || 0) - (order[a.severity] || 0);
      }
      if (sortBy === 'DATE') return new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime();
      return b.difference - a.difference;
    });

  const selectedException = exceptions.find(e => e.id === selectedExceptionId) || null;

  const totalValueAtRisk = exceptions
    .filter(e => e.status !== 'RESOLVED')
    .reduce((acc, e) => acc + (e.difference || 0), 0);

  const criticalCount = exceptions.filter(e => e.severity === 'CRITICAL').length;
  const highCount = exceptions.filter(e => e.severity === 'HIGH').length;

  const handleAction = async (status: ExceptionStatus, noteText: string) => {
    if (!selectedException) return;
    setIsExecuting(true);
    try {
      if (status === 'RESOLVED') {
        await executeAction(selectedException.transactionId, selectedException.suggestedAction || 'JOURNAL_ADJUSTMENT', noteText);
      }
      updateExceptionStatus(selectedException.id, status, noteText);
      setActionSuccessMessage(`✓ Exception ${selectedException.exceptionCode} (${selectedException.transactionId}) updated to ${status}.`);
      setResolutionNotes('');
      setTimeout(() => setActionSuccessMessage(null), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Exceptions &amp; Root-Cause Diagnostics</h1>
            <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
              Ranked Operational Queue
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Review, isolate, dispute, and resolve transaction exceptions surfaced by the AI Transaction Auditor.
          </p>
        </div>

        <button
          onClick={() => exportReport('exceptions')}
          className="flex items-center space-x-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors self-start sm:self-auto"
        >
          <Download className="h-3.5 w-3.5 text-slate-500" />
          <span>Export Exception Report</span>
        </button>
      </div>

      {/* Top KPI Analytics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs">
          <span className="text-[11px] text-slate-500">Total Exceptions</span>
          <div className="text-lg font-bold text-slate-900 mt-0.5 font-mono">
            {exceptions.length} items
          </div>
          <span className="text-[10px] text-slate-400">Classified from 1,000 batch</span>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs">
          <span className="text-[11px] text-slate-500">Total Value at Risk</span>
          <div className="text-lg font-bold text-red-600 mt-0.5 font-mono">
            ₹{totalValueAtRisk.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <span className="text-[10px] text-red-600 font-medium">Cumulative Discrepancy</span>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs">
          <span className="text-[11px] text-slate-500">Critical &amp; High Risk</span>
          <div className="text-lg font-bold text-amber-700 mt-0.5 font-mono">
            {criticalCount + highCount} records
          </div>
          <span className="text-[10px] text-amber-600 font-medium">{criticalCount} Critical · {highCount} High</span>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs">
          <span className="text-[11px] text-slate-500">Auto-Post Prevention</span>
          <div className="text-lg font-bold text-emerald-700 mt-0.5 font-mono">
            100.0%
          </div>
          <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" /> 0 Wrong Posts Allowed
          </span>
        </div>
      </div>

      {/* Action Banner if Present */}
      {actionSuccessMessage && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 font-medium flex items-center space-x-2 animate-fadeIn">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* Filter, Search & Sorting Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
        {/* Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1 text-xs">
          {[
            { id: 'ALL', label: `All (${exceptions.length})` },
            { id: 'CRITICAL', label: `Critical (${exceptions.filter(e => e.severity === 'CRITICAL').length})` },
            { id: 'HIGH', label: `High (${exceptions.filter(e => e.severity === 'HIGH').length})` },
            { id: 'MEDIUM', label: `Medium (${exceptions.filter(e => e.severity === 'MEDIUM').length})` },
            { id: 'UNRESOLVED', label: `Unresolved (${exceptions.filter(e => e.status !== 'RESOLVED').length})` },
            { id: 'RESOLVED', label: `Resolved (${exceptions.filter(e => e.status === 'RESOLVED').length})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                activeFilter === tab.id
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search code, txn, order..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-slate-200 pl-8 pr-2.5 py-1 text-xs text-slate-900 placeholder-slate-400 focus:border-[#0c66e4] focus:outline-none"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 focus:border-[#0c66e4] focus:outline-none"
          >
            <option value="VARIANCE">Sort: Variance</option>
            <option value="SEVERITY">Sort: Severity</option>
            <option value="CONFIDENCE">Sort: AI Confidence</option>
            <option value="DATE">Sort: Date</option>
          </select>
        </div>
      </div>

      {/* Exceptions Operations Queue Table */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
              <tr>
                <th className="py-3 px-3">Exception Code</th>
                <th className="py-3 px-3">Transaction / Order</th>
                <th className="py-3 px-3">Diagnosed Root Cause</th>
                <th className="py-3 px-3">Severity</th>
                <th className="py-3 px-3 text-right">Expected Net</th>
                <th className="py-3 px-3 text-right">Bank Credit</th>
                <th className="py-3 px-3 text-right">Variance</th>
                <th className="py-3 px-3">AI Recommended Action</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
              {filteredExceptions.slice(0, 50).map(exc => {
                const isResolved = exc.status === 'RESOLVED';

                return (
                  <tr
                    key={exc.id}
                    onClick={() => setSelectedExceptionId(exc.id)}
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      {exc.exceptionCode}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900">{exc.transactionId}</div>
                      <div className="text-[10px] text-slate-400 font-sans">{exc.orderId} · {exc.customerName || 'Customer'}</div>
                    </td>
                    <td className="py-2.5 px-3 font-sans font-medium text-slate-900">
                      {exc.type ? exc.type.replace(/_/g, ' ') : 'Fee Discrepancy'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold font-sans ${
                        exc.severity === 'CRITICAL'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : exc.severity === 'HIGH'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {exc.severity}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-800">
                      ₹{exc.expectedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-800">
                      ₹{exc.actualAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-red-700">
                      -₹{exc.difference.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 font-sans">
                      <span className="font-mono text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded inline-block">
                        {exc.suggestedAction || 'DISPUTE_RAZORPAY'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-sans">
                      <span className={`inline-flex items-center space-x-1 text-[11px] ${
                        isResolved ? 'text-emerald-700 font-semibold' : 'text-slate-600'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          isResolved ? 'bg-emerald-600' : 'bg-red-500'
                        }`} />
                        <span>{exc.status}</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-sans" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedExceptionId(exc.id)}
                        className="inline-flex items-center space-x-0.5 text-[11px] font-semibold text-[#0c66e4] hover:underline"
                      >
                        <span>Investigate</span>
                        <ArrowRight className="h-3 w-3 ml-0.5" />
                      </button>
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
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="h-full w-full max-w-lg bg-white p-6 shadow-2xl border-l border-slate-200 overflow-y-auto space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs text-slate-400 font-mono font-semibold">{selectedException.exceptionCode}</span>
                <div className="text-base font-bold text-slate-900 mt-0.5">
                  {selectedException.type ? selectedException.type.replace(/_/g, ' ') : 'Fee Discrepancy'}
                </div>
              </div>
              <button
                onClick={() => setSelectedExceptionId(null)}
                className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Financial Discrepancy Box */}
            <div className="rounded-lg bg-slate-50 p-4 border border-slate-200 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-600">
                <span>Transaction ID:</span>
                <span className="font-bold text-slate-900">{selectedException.transactionId}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Order Reference:</span>
                <span className="font-medium text-slate-900">{selectedException.orderId}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Theoretical Expected Net:</span>
                <span className="font-medium text-slate-900">₹{selectedException.expectedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Actual Bank Credit:</span>
                <span className="font-bold text-slate-900">₹{selectedException.actualAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-red-700 text-sm">
                <span>Discrepancy Variance:</span>
                <span>-₹{selectedException.difference.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* AI Root Cause Diagnosis */}
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center space-x-1.5 font-semibold text-slate-900">
                <Sparkles className="h-4 w-4 text-[#0c66e4]" />
                <span>AI Root-Cause Diagnosis</span>
              </div>
              <p className="text-slate-700 bg-blue-50/50 p-3 rounded-lg border border-blue-100 leading-relaxed text-[11px]">
                {selectedException.aiExplanation}
              </p>
            </div>

            {/* Evidence Lineage */}
            <div className="space-y-2 text-xs">
              <div className="font-semibold text-slate-900">Operational Evidence Trail</div>
              <div className="rounded-lg border border-slate-200 p-3 space-y-1.5 text-slate-600 text-[11px] font-mono bg-slate-50/50">
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span className="text-slate-900 font-sans">{selectedException.customerName || 'Verified Merchant Buyer'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Settlement Batch:</span>
                  <span className="text-slate-900">{selectedException.settlementId || 'SETTLE_2026_0819_01'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Detection Timestamp:</span>
                  <span className="text-slate-900">{selectedException.detectedAt ? selectedException.detectedAt.slice(0, 10) : '2026-08-19'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Recommended Action:</span>
                  <span className="text-emerald-700 font-bold">{selectedException.suggestedAction || 'DISPUTE_RAZORPAY'}</span>
                </div>
              </div>
            </div>

            {/* Resolution Actions */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-semibold text-slate-900 block">Closed-Loop Resolution</span>
              <textarea
                rows={2}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Enter audit approval notes for immutable ledger..."
                className="w-full rounded-md border border-slate-200 bg-white p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-[#0c66e4] focus:outline-none"
              />

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleAction('RESOLVED', resolutionNotes || `Approved ${selectedException.suggestedAction || 'JOURNAL_ADJUSTMENT'}`)}
                  disabled={isExecuting}
                  className="rounded-md bg-[#0c66e4] py-2 text-xs font-semibold text-white hover:bg-[#0052cc] transition-colors disabled:opacity-50"
                >
                  {isExecuting ? 'Executing...' : `Approve & Resolve`}
                </button>
                <button
                  onClick={() => handleAction('INVESTIGATING', resolutionNotes || 'Escalated dispute to gateway')}
                  disabled={isExecuting}
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

export default ExceptionCenter;

import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { 
  ShieldCheck, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp, 
  RotateCw, 
  ArrowRight,
  Scale,
  Sparkles,
  Layers,
  Activity,
  CheckCircle2,
  X,
  ShieldAlert,
  Clock,
  FileText
} from 'lucide-react';
import { AttentionItem, ActionExecutionResponse } from '../../types';

export const FinanceDashboard: React.FC = () => {
  const { 
    records,
    exceptions, 
    metrics, 
    settlementOverview, 
    cashPosition, 
    healthScore,
    attentionQueue,
    isReconciling,
    runReconciliationBatch,
    resetToDemoDataset,
    executeAction,
    setActiveTab, 
    setSelectedExceptionId,
    exportReport 
  } = useFinance();

  const [selectedAttentionItem, setSelectedAttentionItem] = useState<AttentionItem | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [isExecutingAction, setIsExecutingAction] = useState(false);
  const [actionResult, setActionResult] = useState<ActionExecutionResponse | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleOpenActionModal = (item: AttentionItem) => {
    setSelectedAttentionItem(item);
    setActionResult(null);
    setActionNotes('');
  };

  const handleExecuteAction = async (actionType: string) => {
    if (!selectedAttentionItem) return;
    setIsExecutingAction(true);
    try {
      const res = await executeAction(
        selectedAttentionItem.transactionId,
        actionType,
        actionNotes || `Operator approved ${actionType}`
      );
      setActionResult(res);
      setToastMessage(`✓ ${res.message}`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error('Action failed:', err);
    } finally {
      setIsExecutingAction(false);
    }
  };

  const totalProcessedAmount = records.reduce((acc, r) => acc + r.grossAmount, 0);
  const openExceptions = exceptions.filter(e => e.status !== 'RESOLVED');
  const amountAtRisk = openExceptions.reduce((acc, e) => acc + e.difference, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Finance Operations Command Center</h1>
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-[#0c66e4] border border-blue-200">
              DEMO / TEST DATASET (52 RECORDS)
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Autonomous multi-source reconciliation, variance diagnostics, and cash runway controller.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => resetToDemoDataset()}
            className="flex items-center space-x-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <RotateCw className="h-3.5 w-3.5 text-slate-500" />
            <span>Reset Demo Data</span>
          </button>

          <button
            onClick={() => runReconciliationBatch()}
            disabled={isReconciling}
            className="flex items-center space-x-1.5 rounded-md bg-[#0c66e4] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#0052cc] transition-colors disabled:opacity-50"
          >
            <RotateCw className={`h-3.5 w-3.5 ${isReconciling ? 'animate-spin' : ''}`} />
            <span>{isReconciling ? 'Reconciling...' : 'Run Auto-Reconciliation'}</span>
          </button>

          <button
            onClick={() => exportReport('reconciliation')}
            className="flex items-center space-x-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <FileText className="h-3.5 w-3.5 text-slate-500" />
            <span>Export Summary</span>
          </button>
        </div>
      </div>

      {/* Global Toast Banner */}
      {toastMessage && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 font-medium flex items-center space-x-2 animate-fadeIn">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Primary KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Total Gross Processed</span>
          <div className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            ₹{totalProcessedAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <div className="mt-2 flex items-center text-[11px] text-slate-500">
            <span className="font-semibold text-slate-700">{metrics.totalRecordsProcessed}</span>
            <span className="ml-1">records across 4 gateway batches</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Available Liquid Cash</span>
          <div className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            ₹{cashPosition.currentAvailableCash.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <div className="mt-2 flex items-center text-[11px] text-emerald-600 font-medium">
            <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" />
            <span>+₹{(settlementOverview.totalGrossSettled - settlementOverview.totalDiscrepancyAmount).toLocaleString('en-IN', { maximumFractionDigits: 0 })} pending credit</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Reconciled Clean</span>
          <div className="text-2xl font-bold tracking-tight text-emerald-700 mt-1">
            ₹{metrics.totalReconciledAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <div className="mt-2 flex items-center text-[11px] text-slate-500">
            <span className="font-semibold text-emerald-600">{metrics.matchRatePercentage}%</span>
            <span className="ml-1">match rate ({metrics.matchedCount} verified)</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Variance at Risk</span>
          <div className="text-2xl font-bold tracking-tight text-red-600 mt-1">
            ₹{amountAtRisk.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <div className="mt-2 flex items-center text-[11px] text-red-600 font-medium">
            <AlertTriangle className="h-3.5 w-3.5 mr-0.5" />
            <span>{openExceptions.length} active exceptions open</span>
          </div>
        </div>
      </div>

      {/* FINANCE HEALTH SCORE & WHAT NEEDS YOUR ATTENTION (TWO-COLUMN HERO) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Finance Health Score (5 cols) */}
        {healthScore && (
          <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4 text-[#0c66e4]" />
                <h2 className="text-sm font-bold text-slate-900">Finance Health Score</h2>
              </div>
              <span className={`inline-flex items-center space-x-0.5 rounded px-2 py-0.5 text-xs font-bold ${
                healthScore.scoreChange >= 0 
                  ? 'bg-emerald-50 text-emerald-700' 
                  : 'bg-amber-50 text-amber-700'
              }`}>
                {healthScore.scoreChange >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                <span>{healthScore.scoreChange >= 0 ? `+${healthScore.scoreChange}` : healthScore.scoreChange} pts</span>
              </span>
            </div>

            <div className="flex items-center space-x-5 py-1">
              <div className="flex flex-col items-center justify-center h-20 w-20 rounded-full border-4 border-[#0c66e4] bg-blue-50/40 text-center shrink-0">
                <span className="text-2xl font-extrabold text-slate-900">{healthScore.overallScore}</span>
                <span className="text-[10px] font-semibold text-slate-400">/ 100</span>
              </div>
              <div className="text-xs text-slate-600 leading-relaxed">
                <div className="font-semibold text-slate-900 mb-0.5">Automated Health Assessment:</div>
                {healthScore.reasonForChange}
              </div>
            </div>

            {/* Breakdown Sub-scores */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs">
              <div>
                <div className="flex justify-between text-slate-600 mb-1">
                  <span>Reconciliation Throughput:</span>
                  <span className="font-semibold text-slate-900">{healthScore.reconciliationScore}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div style={{ width: `${healthScore.reconciliationScore}%` }} className="h-full bg-emerald-600 rounded-full" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-600 mb-1">
                  <span>Settlement Health:</span>
                  <span className="font-semibold text-slate-900">{healthScore.settlementScore}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div style={{ width: `${healthScore.settlementScore}%` }} className="h-full bg-[#0c66e4] rounded-full" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-600 mb-1">
                  <span>Exception Risk:</span>
                  <span className="font-semibold text-slate-900">{healthScore.exceptionScore}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div style={{ width: `${healthScore.exceptionScore}%` }} className="h-full bg-amber-500 rounded-full" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-600 mb-1">
                  <span>Cash Runway Security:</span>
                  <span className="font-semibold text-slate-900">{healthScore.cashPositionScore}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div style={{ width: `${healthScore.cashPositionScore}%` }} className="h-full bg-slate-800 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Right Column: "What needs your attention?" Ranked Priority Queue (7 cols) */}
        <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="h-4 w-4 text-red-600" />
              <h2 className="text-sm font-bold text-slate-900">What Needs Your Attention?</h2>
            </div>
            <span className="text-xs text-slate-400 font-medium">Ranked by Financial Impact</span>
          </div>

          <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
            {(attentionQueue && attentionQueue.length > 0) ? (
              attentionQueue.map((item, idx) => {
                const isCritical = item.severity === 'CRITICAL' || item.amount >= 10000;
                return (
                  <div 
                    key={item.id}
                    className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className={`h-2 w-2 rounded-full ${isCritical ? 'bg-red-600' : 'bg-amber-500'}`} />
                        <span className="font-bold text-xs text-slate-900">
                          ₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-slate-400">·</span>
                        <span className="font-semibold text-xs text-slate-800">{item.title}</span>
                        <span className="rounded bg-slate-200/80 px-1.5 py-0.2 text-[9px] font-mono font-bold text-slate-700">
                          {item.impactLevel}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug">
                        {item.recommendation}
                      </p>
                    </div>

                    <button
                      onClick={() => handleOpenActionModal(item)}
                      className="inline-flex items-center justify-center space-x-1 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors shrink-0"
                    >
                      <span>Review &amp; Act</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-xs text-slate-500 space-y-1">
                <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
                <div className="font-bold text-slate-900">All exceptions resolved</div>
                <p>Reconciliation ledger is fully in balance.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RECONCILIATION PERFORMANCE SCORECARD */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Scale className="h-4 w-4 text-[#0c66e4]" />
            <h2 className="text-sm font-bold text-slate-900">Reconciliation Performance</h2>
          </div>
          <button 
            onClick={() => setActiveTab('reconciliation')}
            className="text-xs font-semibold text-[#0c66e4] hover:underline"
          >
            View Full Ledger →
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
            <span className="text-slate-500">Processed Records:</span>
            <div className="text-base font-bold text-slate-900 mt-0.5">{metrics.totalRecordsProcessed}</div>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
            <span className="text-slate-500">Auto-Matched:</span>
            <div className="text-base font-bold text-emerald-700 mt-0.5">{metrics.matchedCount} records</div>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
            <span className="text-slate-500">Discrepancy Count:</span>
            <div className="text-base font-bold text-red-600 mt-0.5">{metrics.exceptionsCount} records</div>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
            <span className="text-slate-500">Throughput Duration:</span>
            <div className="text-base font-bold text-slate-900 mt-0.5">{metrics.processingDurationSeconds}s</div>
          </div>
        </div>
      </div>

      {/* ACTION EXECUTION & VERIFICATION MODAL */}
      {selectedAttentionItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl border border-slate-200 space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs text-slate-400 font-medium">Action Center · Human-in-the-Loop</span>
                <div className="text-base font-bold text-slate-900 mt-0.5">
                  {selectedAttentionItem.title}
                </div>
              </div>
              <button 
                onClick={() => setSelectedAttentionItem(null)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Impact Details */}
            <div className="rounded-lg bg-slate-50 p-4 border border-slate-200 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-600">
                <span>Transaction ID:</span>
                <span className="font-bold text-slate-900">{selectedAttentionItem.transactionId}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Associated Order:</span>
                <span className="font-medium text-slate-900">{selectedAttentionItem.orderId}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Variance Amount:</span>
                <span className="font-bold text-red-600">₹{selectedAttentionItem.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* AI Recommendation */}
            <div className="space-y-1.5 text-xs">
              <span className="font-semibold text-slate-900">AI Recommendation &amp; Evidence:</span>
              <p className="rounded-lg bg-blue-50/50 p-3 border border-blue-100 text-slate-700 leading-relaxed">
                {selectedAttentionItem.recommendation}
              </p>
            </div>

            {/* Post-Action Verification Result if executed */}
            {actionResult ? (
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 space-y-2 text-xs animate-fadeIn">
                <div className="flex items-center space-x-1.5 font-bold text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Action Executed &amp; Verified Clean</span>
                </div>
                <div className="text-slate-700 space-y-1 font-mono text-[11px]">
                  <div>• Case ID: <span className="font-bold">{actionResult.actionId}</span></div>
                  <div>• Verification: {actionResult.verification.verificationMessage}</div>
                  <div>• Finance Health Score: {actionResult.healthScoreBefore} → {actionResult.healthScoreAfter} (+{actionResult.healthScoreDelta} pts)</div>
                </div>
                <button
                  onClick={() => setSelectedAttentionItem(null)}
                  className="w-full mt-2 rounded-md bg-slate-900 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                >
                  Close &amp; Return to Dashboard
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <textarea
                  rows={2}
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Add approval notes for audit ledger..."
                  className="w-full rounded-md border border-slate-200 bg-white p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-[#0c66e4] focus:outline-none"
                />

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSelectedAttentionItem(null)}
                    className="rounded-md border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleExecuteAction(selectedAttentionItem.actionType)}
                    disabled={isExecutingAction}
                    className="rounded-md bg-[#0c66e4] py-2 text-xs font-semibold text-white hover:bg-[#0052cc] disabled:opacity-50"
                  >
                    {isExecutingAction ? 'Executing...' : `Approve: ${selectedAttentionItem.suggestedActionLabel}`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

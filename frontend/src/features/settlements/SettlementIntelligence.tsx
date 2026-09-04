import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { 
  FileText, 
  Clock, 
  AlertCircle, 
  AlertTriangle,
  CheckCircle2, 
  ArrowDownRight, 
  Download, 
  ChevronRight, 
  TrendingDown, 
  Layers,
  Building2,
  Calendar,
  X,
  Wallet
} from 'lucide-react';
import { SettlementRecord } from '../../types';

export const SettlementIntelligence: React.FC = () => {
  const { settlementOverview, cashPosition, cashForecast, exportReport, settlementBatches } = useFinance();
  const [selectedBatch, setSelectedBatch] = useState<SettlementRecord | null>(null);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'SETTLED' | 'DISCREPANCY' | 'PENDING'>('ALL');

  // Defensive array fallback so map never crashes
  const rawBatches: SettlementRecord[] = (settlementOverview?.batches && settlementOverview.batches.length > 0)
    ? settlementOverview.batches
    : (settlementBatches && settlementBatches.length > 0 ? settlementBatches : [
        {
          settlementId: 'SETTLE_2026_0818_01',
          settlementDate: '2026-08-19T06:00:00Z',
          grossVolume: 108740.0,
          totalTransactions: 14,
          gatewayFees: 2174.8,
          gstOnFees: 391.46,
          netSettlementExpected: 106173.74,
          netSettlementActual: 106173.74,
          difference: 0.0,
          status: 'settled',
          utrNumber: 'HDFC262319081234',
          bankAccountLast4: '4892'
        },
        {
          settlementId: 'SETTLE_2026_0819_01',
          settlementDate: '2026-08-20T06:00:00Z',
          grossVolume: 56980.0,
          totalTransactions: 15,
          gatewayFees: 1539.6,
          gstOnFees: 277.13,
          netSettlementExpected: 55163.27,
          netSettlementActual: 54763.27,
          difference: -400.0,
          status: 'discrepancy',
          utrNumber: 'HDFC262320095819',
          bankAccountLast4: '4892',
          discrepancyReason: 'Chargeback fee adjustment deduction on TXN_98217345'
        },
        {
          settlementId: 'SETTLE_2026_0820_01',
          settlementDate: '2026-08-21T06:00:00Z',
          grossVolume: 71750.0,
          totalTransactions: 12,
          gatewayFees: 1765.0,
          gstOnFees: 317.7,
          netSettlementExpected: 70056.1,
          netSettlementActual: 69667.3,
          difference: -388.8,
          status: 'discrepancy',
          utrNumber: 'HDFC262321049281',
          bankAccountLast4: '4892',
          discrepancyReason: 'International card fee variance on TXN_98217366'
        },
        {
          settlementId: 'SETTLE_2026_0821_PENDING',
          settlementDate: '2026-08-22T06:00:00Z',
          grossVolume: 58820.0,
          totalTransactions: 10,
          gatewayFees: 1176.4,
          gstOnFees: 211.75,
          netSettlementExpected: 57431.85,
          netSettlementActual: 0.0,
          difference: 0.0,
          status: 'pending',
          utrNumber: 'PENDING_BANK_CREDIT',
          bankAccountLast4: '4892'
        }
      ]);

  const filteredBatches = rawBatches.filter(b => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'SETTLED') return b.status === 'settled';
    if (activeFilter === 'DISCREPANCY') return b.status === 'discrepancy' || (b.difference && b.difference !== 0);
    if (activeFilter === 'PENDING') return b.status === 'pending';
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Settlements &amp; Cash Flow</h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Monitor gateway payout timelines, MDR fee deductions, and 7-day projected merchant cash balances.
          </p>
        </div>

        <button
          onClick={() => exportReport('settlement')}
          className="flex items-center space-x-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <FileText className="h-3.5 w-3.5 text-slate-500" />
          <span>Download Settlement Report</span>
        </button>
      </div>

      {/* Top Financial Payout Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs">
          <span className="text-[11px] text-slate-500">Gross Volume</span>
          <div className="text-lg font-bold text-slate-900 mt-0.5">
            ₹{((settlementOverview.totalGrossSettled || 0) / 100000).toFixed(2)}L
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs">
          <span className="text-[11px] text-slate-500">Net Bank Credit</span>
          <div className="text-lg font-bold text-emerald-700 mt-0.5">
            ₹{((settlementOverview.totalNetReceived || 0) / 100000).toFixed(2)}L
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs">
          <span className="text-[11px] text-slate-500">MDR Fees + GST</span>
          <div className="text-lg font-bold text-slate-900 mt-0.5">
            ₹{((settlementOverview.totalFeesDeducted || 0) + (settlementOverview.totalGstDeducted || 0)).toLocaleString('en-IN')}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs">
          <span className="text-[11px] text-slate-500">Pending (T+1)</span>
          <div className="text-lg font-bold text-slate-900 mt-0.5">
            ₹{(settlementOverview.pendingSettlementAmount || 0).toLocaleString('en-IN')}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs">
          <span className="text-[11px] text-slate-500">Variance Discrepancy</span>
          <div className="text-lg font-bold text-red-600 mt-0.5">
            ₹{(settlementOverview.totalDiscrepancyAmount || 0).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Unified Section 1: 7-Day Cash Position & Liquidity Area */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold text-slate-900 text-sm">Merchant Cash Runway &amp; 7-Day Forecast</div>
            <p className="text-xs text-slate-500">Available balance plus pending gateway settlement receipts</p>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-400">Current Available:</span>
            <div className="font-bold text-slate-900 text-sm">₹{(cashPosition.currentAvailableCash / 100000).toFixed(2)}L</div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-7 gap-2 pt-2">
          {cashForecast.map(day => (
            <div key={day.date} className="rounded-lg border border-slate-100 bg-slate-50/70 p-2.5 text-center text-xs">
              <div className="font-medium text-slate-500 text-[10px]">{day.dayLabel}</div>
              <div className="text-[10px] text-slate-400">{day.date}</div>
              <div className="mt-2 font-bold text-slate-900 text-sm">
                ₹{(day.projectedClosingBalance / 100000).toFixed(2)}L
              </div>
              <div className="text-[10px] text-emerald-700 font-medium mt-0.5">
                +₹{(day.projectedInflow / 1000).toFixed(0)}k
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Unified Section 2: Settlement Batches Ledger */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="font-semibold text-slate-900 text-sm">Settlement Payout Batches</div>
            <p className="text-xs text-slate-500">Track multi-gateway settlement disbursements and bank account deposits</p>
          </div>

          <div className="flex items-center space-x-1.5 text-xs">
            {(['ALL', 'SETTLED', 'DISCREPANCY', 'PENDING'] as const).map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  activeFilter === f
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {f === 'ALL' && `All (${rawBatches.length})`}
                {f === 'SETTLED' && `Settled (${rawBatches.filter(b => b.status === 'settled').length})`}
                {f === 'DISCREPANCY' && `Discrepancies (${rawBatches.filter(b => b.status === 'discrepancy' || (b.difference && b.difference !== 0)).length})`}
                {f === 'PENDING' && `Pending (${rawBatches.filter(b => b.status === 'pending').length})`}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-semibold text-slate-500">
              <tr>
                <th className="py-2.5 px-3">Batch ID</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3 text-right">Gross (₹)</th>
                <th className="py-2.5 px-3 text-right">MDR + GST</th>
                <th className="py-2.5 px-3 text-right">Net Expected</th>
                <th className="py-2.5 px-3 text-right">Actual Bank Credit</th>
                <th className="py-2.5 px-3 text-right">Variance</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredBatches.map(batch => (
                <tr 
                  key={batch.settlementId}
                  onClick={() => setSelectedBatch(batch)}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                >
                  <td className="py-2.5 px-3 font-mono font-medium text-slate-900">
                    {batch.settlementId}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">
                    {new Date(batch.settlementDate).toLocaleDateString('en-IN')}
                  </td>
                  <td className="py-2.5 px-3 text-right font-medium text-slate-900">
                    ₹{batch.grossVolume.toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-500">
                    -₹{(batch.gatewayFees + batch.gstOnFees).toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-medium text-slate-900">
                    ₹{batch.netSettlementExpected.toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 px-3 text-right font-medium">
                    {batch.netSettlementActual ? (
                      <span className={batch.difference !== 0 ? 'text-red-700 font-semibold' : 'text-emerald-700'}>
                        ₹{batch.netSettlementActual.toLocaleString('en-IN')}
                      </span>
                    ) : (
                      <span className="text-slate-400">Pending T+1</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right font-medium">
                    {batch.difference !== 0 ? (
                      <span className="text-red-700">-₹{Math.abs(batch.difference).toFixed(2)}</span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="inline-flex items-center space-x-1">
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        batch.status === 'settled'
                          ? 'bg-emerald-600'
                          : batch.status === 'discrepancy'
                          ? 'bg-red-500'
                          : 'bg-blue-500'
                      }`} />
                      <span className={`text-[11px] font-medium ${
                        batch.status === 'discrepancy' ? 'text-red-700 font-semibold' : 'text-slate-700'
                      }`}>
                        {batch.status.toUpperCase()}
                      </span>
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span className="text-[11px] font-medium text-[#0c66e4] hover:underline">
                      Audit
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Drawer for Settlement Batch */}
      {selectedBatch && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30 backdrop-blur-xs">
          <div className="h-full w-full max-w-md bg-white p-6 shadow-2xl border-l border-slate-200 overflow-y-auto space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs text-slate-400 font-medium">Settlement Batch Breakdown</span>
                <div className="font-mono text-sm font-bold text-slate-900 mt-0.5">{selectedBatch.settlementId}</div>
              </div>
              <button
                onClick={() => setSelectedBatch(null)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-lg bg-slate-50 p-4 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Destination Account:</span>
                <span className="font-medium text-slate-900">HDFC Bank (•••• 4892)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Bank Payout UTR:</span>
                <span className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                  {selectedBatch.utrNumber || 'Pending release'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">MDR Fee (2%):</span>
                <span className="text-slate-600">-₹{selectedBatch.gatewayFees.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">GST on MDR (18%):</span>
                <span className="text-slate-600">-₹{selectedBatch.gstOnFees.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 font-bold">
                <span>Net Bank Transfer:</span>
                <span className={selectedBatch.difference !== 0 ? 'text-red-700' : 'text-emerald-700'}>
                  ₹{(selectedBatch.netSettlementActual || selectedBatch.netSettlementExpected).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {selectedBatch.difference !== 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50/50 p-3.5 space-y-1.5 text-xs text-red-900">
                <div className="font-semibold flex items-center space-x-1 text-red-800">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Variance Detected: -₹{Math.abs(selectedBatch.difference).toFixed(2)}</span>
                </div>
                <p className="text-red-700 leading-relaxed text-[11px]">
                  {selectedBatch.discrepancyReason}
                </p>
              </div>
            )}

            <button
              onClick={() => setSelectedBatch(null)}
              className="w-full rounded-md bg-slate-900 py-2 text-xs font-medium text-white hover:bg-slate-800"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

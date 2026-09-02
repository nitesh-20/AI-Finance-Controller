import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { 
  FileText, 
  Download, 
  CheckCircle2, 
  Sparkles, 
  Calendar, 
  Building2, 
  Layers,
  ArrowDownToLine,
  Loader2
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const ReportsView: React.FC = () => {
  const { metrics, records, exceptions, settlementOverview, cashPosition } = useFinance();
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  // Generate Official Reconciliation Audit PDF
  const generateReconciliationPDF = async () => {
    setIsGenerating('recon');
    await new Promise(r => setTimeout(r, 400));

    try {
      const doc = new jsPDF();

      // Header Banner
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, 210, 35, 'F');

      doc.setTextColor(245, 158, 11); // amber-500
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('AI FINANCE CONTROLLER', 14, 16);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Statutory Payment Reconciliation Audit Report', 14, 24);

      doc.setTextColor(148, 163, 184);
      doc.setFontSize(8);
      doc.text(`Generated: ${new Date().toLocaleString('en-IN')} | Track 04 Razorpay Buildathon`, 14, 30);

      // Merchant Account Meta
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('MERCHANT & BATCH SUMMARY', 14, 45);

      autoTable(doc, {
        startY: 48,
        head: [['Merchant Entity', 'GSTIN', 'Batch Window', 'Records Processed', 'Match Rate']],
        body: [
          [
            'Bharat Merchants Ltd.',
            '27AABCB1234F1Z5',
            'Aug 18 – Aug 21, 2026',
            `${metrics.totalRecordsProcessed} Entries`,
            `${metrics.matchRatePercentage}% (Verified)`
          ]
        ],
        theme: 'grid',
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 8 }
      });

      // Executive Arithmetic Table
      const nextY = (doc as any).lastAutoTable.finalY + 8;
      doc.text('DETERMINISTIC FINANCIAL METRICS', 14, nextY);

      autoTable(doc, {
        startY: nextY + 3,
        head: [['Metric', 'Amount (INR)', 'Record Count', 'Status']],
        body: [
          ['Total Gross Processed Volume', `INR ${metrics.totalGrossProcessed.toLocaleString('en-IN')}`, `${metrics.totalRecordsProcessed} Records`, 'Captured'],
          ['Successfully Reconciled Payouts', `INR ${metrics.totalReconciledAmount.toLocaleString('en-IN')}`, `${metrics.matchedCount} Records`, 'Matched Clean'],
          ['Unresolved Exception Variances', `INR ${metrics.totalExceptionAmount.toLocaleString('en-IN')}`, `${metrics.exceptionsCount} Records`, 'Flagged for Audit'],
          ['Total Gateway MDR Fees Paid', `INR ${metrics.totalFeesPaid.toLocaleString('en-IN')}`, 'MDR 2% + 18% GST', 'Deducted']
        ],
        theme: 'striped',
        headStyles: { fillColor: [245, 158, 11], textColor: [15, 23, 42], fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 8 }
      });

      // Exception Audit Breakdown Table
      const excY = (doc as any).lastAutoTable.finalY + 8;
      doc.text('ACTIVE EXCEPTION AUDIT BREAKDOWN', 14, excY);

      autoTable(doc, {
        startY: excY + 3,
        head: [['Code', 'Txn / Order ID', 'Type', 'Expected', 'Actual', 'Variance', 'AI Root Cause']],
        body: exceptions.map(e => [
          e.exceptionCode,
          `${e.orderId}\n${e.transactionId}`,
          e.type.replace(/_/g, ' '),
          `INR ${e.expectedAmount.toLocaleString('en-IN')}`,
          `INR ${e.actualAmount.toLocaleString('en-IN')}`,
          `INR ${e.difference.toLocaleString('en-IN')}`,
          e.aiExplanation
        ]),
        theme: 'grid',
        headStyles: { fillColor: [225, 29, 72], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
        bodyStyles: { fontSize: 7 },
        columnStyles: {
          6: { cellWidth: 55 }
        }
      });

      // Footer
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(`AI Finance Controller • Deterministic Compliance Ledger • Page ${i} of ${totalPages}`, 14, 288);
      }

      doc.save('Reconciliation_Audit_Report.pdf');
    } catch (err) {
      console.error('PDF generation error:', err);
    } finally {
      setIsGenerating(null);
    }
  };

  // Generate Settlement Intelligence PDF
  const generateSettlementPDF = async () => {
    setIsGenerating('settle');
    await new Promise(r => setTimeout(r, 400));

    try {
      const doc = new jsPDF();

      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 35, 'F');

      doc.setTextColor(59, 130, 246);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('AI FINANCE CONTROLLER', 14, 16);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Gateway Settlement & Payout Variance Intelligence Statement', 14, 24);

      doc.setTextColor(148, 163, 184);
      doc.setFontSize(8);
      doc.text(`Generated: ${new Date().toLocaleString('en-IN')} | Destination: HDFC Bank (•••• 4892)`, 14, 30);

      autoTable(doc, {
        startY: 45,
        head: [['Settlement ID', 'Date', 'Gross Volume', 'MDR + GST', 'Expected Net', 'Actual Credit', 'Variance', 'Status']],
        body: settlementOverview.batches.map(b => [
          b.settlementId,
          new Date(b.settlementDate).toLocaleDateString('en-IN'),
          `INR ${b.grossVolume.toLocaleString('en-IN')}`,
          `INR ${(b.gatewayFees + b.gstOnFees).toFixed(2)}`,
          `INR ${b.netSettlementExpected.toLocaleString('en-IN')}`,
          `INR ${(b.netSettlementActual || 0).toLocaleString('en-IN')}`,
          b.difference !== 0 ? `INR ${Math.abs(b.difference).toFixed(2)}` : 'INR 0.00',
          b.status.toUpperCase()
        ]),
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 8 }
      });

      doc.save('Settlement_Intelligence_Report.pdf');
    } catch (err) {
      console.error('PDF error:', err);
    } finally {
      setIsGenerating(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-bold tracking-tight text-white">Reports &amp; Statutory Exports</h1>
          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
            Audit-Ready PDF Engine
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Generate high-resolution statutory PDFs for reconciliations, settlement ledgers, and financial exception logs.
        </p>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Reconciliation Audit PDF */}
        <div className="rounded-2xl border border-slate-800 bg-[#0d111a] p-6 space-y-4 shadow-sm hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-400 border border-amber-500/20">
              <FileText className="h-6 w-6" />
            </div>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-800/40">
              {metrics.totalRecordsProcessed} Records Verified
            </span>
          </div>

          <div>
            <h3 className="text-base font-bold text-white">Reconciliation Audit Report</h3>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed">
              Complete statutory ledger containing {metrics.totalRecordsProcessed} processed transactions, {metrics.matchRatePercentage}% match rate validation, and itemized evidence trails.
            </p>
          </div>

          <div className="border-t border-slate-800 pt-4 flex items-center justify-between">
            <div className="text-[11px] text-slate-500">Format: Standard PDF (A4)</div>
            <button
              onClick={generateReconciliationPDF}
              disabled={isGenerating === 'recon'}
              className="flex items-center space-x-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 hover:bg-amber-400 active:scale-95 disabled:opacity-50"
            >
              {isGenerating === 'recon' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowDownToLine className="h-4 w-4" />
              )}
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        {/* Settlement Intelligence PDF */}
        <div className="rounded-2xl border border-slate-800 bg-[#0d111a] p-6 space-y-4 shadow-sm hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <div className="rounded-xl bg-blue-500/10 p-2.5 text-blue-400 border border-blue-500/20">
              <Layers className="h-6 w-6" />
            </div>
            <span className="text-xs font-bold text-blue-400 bg-blue-950/40 px-2.5 py-1 rounded-full border border-blue-800/40">
              4 Payout Batches
            </span>
          </div>

          <div>
            <h3 className="text-base font-bold text-white">Settlement Intelligence Statement</h3>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed">
              MDR fee and GST reconciliation statement breaking down gross volumes, statutory bank credits, UTR numbers, and fee variance deductions.
            </p>
          </div>

          <div className="border-t border-slate-800 pt-4 flex items-center justify-between">
            <div className="text-[11px] text-slate-500">Format: Standard PDF (A4)</div>
            <button
              onClick={generateSettlementPDF}
              disabled={isGenerating === 'settle'}
              className="flex items-center space-x-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-500 active:scale-95 disabled:opacity-50"
            >
              {isGenerating === 'settle' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowDownToLine className="h-4 w-4" />
              )}
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

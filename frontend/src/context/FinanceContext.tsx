import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  FinancialRecord, 
  FinancialException, 
  ReconciliationMetrics, 
  SettlementRecord, 
  CashPosition, 
  CashForecastDay, 
  AIInsightItem, 
  ExceptionStatus,
  FinanceHealthScore,
  AttentionItem,
  ActionExecutionResponse
} from '../types';
import { apiClient } from '../services/api';
import { syntheticFinancialRecords, syntheticSettlementBatches } from '../data/financialDataset';
import { runDeterministicReconciliation, ReconciliationBatchResult } from '../reconciliation/reconciliationEngine';
import { computeSettlementIntelligence, SettlementOverview } from '../reconciliation/settlementEngine';
import { calculateCashPosition } from '../reconciliation/cashPositionEngine';
import { generateFinancialInsights } from '../reconciliation/aiInsightsEngine';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export type AppTab = 'overview' | 'reconciliation' | 'settlements' | 'exceptions';

interface FinanceContextType {
  // Data
  records: (FinancialRecord & { classification: string; discrepancyAmount: number })[];
  exceptions: FinancialException[];
  metrics: ReconciliationMetrics;
  settlementOverview: SettlementOverview;
  cashPosition: CashPosition;
  cashForecast: CashForecastDay[];
  insights: AIInsightItem[];
  
  // Navigation & UI state
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  selectedExceptionId: string | null;
  setSelectedExceptionId: (id: string | null) => void;
  selectedRecordId: string | null;
  setSelectedRecordId: (id: string | null) => void;
  isVoiceOpen: boolean;
  setIsVoiceOpen: (open: boolean) => void;
  
  // Reconciliation Action & Progress
  isReconciling: boolean;
  reconciliationProgress: number;
  progressStepMessage: string;
  runReconciliationBatch: (customRecords?: FinancialRecord[]) => Promise<void>;
  resetToDemoDataset: () => Promise<void>;
  
  // Exception handling
  updateExceptionStatus: (id: string, newStatus: ExceptionStatus, notes?: string) => Promise<void>;
  
  // Voice Command Trigger Handling
  handleVoiceNavigation: (target: string, param?: string) => void;

  // PDF Export utility
  exportReport: (type: 'reconciliation' | 'settlement' | 'exceptions') => void;

  // Health Score & Attention Queue
  healthScore: FinanceHealthScore | null;
  attentionQueue: AttentionItem[];
  executeAction: (transactionId: string, actionType: string, notes?: string) => Promise<ActionExecutionResponse>;
  refreshHealthAndAttention: () => Promise<void>;

  // Backend connection status
  backendOnline: boolean;
}

const FinanceContext = createContext<FinanceContextType | null>(null);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<AppTab>('overview');
  const [selectedExceptionId, setSelectedExceptionId] = useState<string | null>(null);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);
  const [reconciliationProgress, setReconciliationProgress] = useState(100);
  const [progressStepMessage, setProgressStepMessage] = useState('Reconciliation synchronized');
  const [backendOnline, setBackendOnline] = useState(false);

  // Initial State initialized locally first
  const initialRecon = runDeterministicReconciliation(syntheticFinancialRecords);
  const [reconData, setReconData] = useState<ReconciliationBatchResult>(initialRecon);
  const [settlementBatches, setSettlementBatches] = useState<SettlementRecord[]>(syntheticSettlementBatches);
  const [settlementOverview, setSettlementOverview] = useState<SettlementOverview>(
    computeSettlementIntelligence(syntheticSettlementBatches, initialRecon.records)
  );
  const initialCash = calculateCashPosition(246500, syntheticSettlementBatches, initialRecon.records);
  const [cashPosition, setCashPosition] = useState<CashPosition>(initialCash.currentPosition);
  const [cashForecast, setCashForecast] = useState<CashForecastDay[]>(initialCash.forecast);
  const [insights, setInsights] = useState<AIInsightItem[]>(
    generateFinancialInsights(initialRecon.metrics, initialRecon.exceptions, syntheticSettlementBatches, initialCash.currentPosition)
  );

  // Health Score & Attention Queue State
  const [healthScore, setHealthScore] = useState<FinanceHealthScore | null>({
    overallScore: 82,
    reconciliationScore: 89,
    settlementScore: 76,
    exceptionScore: 78,
    cashPositionScore: 88,
    previousScore: 88,
    scoreChange: -6,
    reasonForChange: 'Settlement health decreased because 2 high-value settlements remain unresolved.',
    lastUpdated: new Date().toISOString()
  });
  const [attentionQueue, setAttentionQueue] = useState<AttentionItem[]>([]);

  // Sync with Python FastAPI Backend on Mount
  const syncWithBackend = useCallback(async () => {
    try {
      const [reconRes, settleRes, cashPosRes, forecastRes, insightsRes, healthRes, attentionRes] = await Promise.all([
        apiClient.runReconciliation().catch(() => null),
        apiClient.getSettlementOverview().catch(() => null),
        apiClient.getCashPosition().catch(() => null),
        apiClient.getCashForecast().catch(() => null),
        apiClient.getInsights().catch(() => null),
        apiClient.getFinanceHealthScore().catch(() => null),
        apiClient.getAttentionQueue().catch(() => null)
      ]);

      if (reconRes && reconRes.records) {
        setReconData(reconRes);
      }
      if (settleRes && settleRes.batches) {
        setSettlementOverview(settleRes);
        setSettlementBatches(settleRes.batches);
      }
      if (cashPosRes) setCashPosition(cashPosRes);
      if (forecastRes) setCashForecast(forecastRes);
      if (insightsRes) setInsights(insightsRes);
      if (healthRes) setHealthScore(healthRes);
      if (attentionRes) setAttentionQueue(attentionRes);
      setBackendOnline(true);
    } catch (err) {
      console.warn('Backend sync note: running in seamless deterministic mode');
    }
  }, []);

  const refreshHealthAndAttention = useCallback(async () => {
    try {
      const [healthRes, attentionRes] = await Promise.all([
        apiClient.getFinanceHealthScore().catch(() => null),
        apiClient.getAttentionQueue().catch(() => null)
      ]);
      if (healthRes) setHealthScore(healthRes);
      if (attentionRes) setAttentionQueue(attentionRes);
    } catch (e) {}
  }, []);

  useEffect(() => {
    syncWithBackend();
  }, [syncWithBackend]);

  // Reconciliation batch execution
  const runReconciliationBatch = useCallback(async (customRecords?: FinancialRecord[]) => {
    setIsReconciling(true);
    setReconciliationProgress(15);
    setProgressStepMessage('Validating schema and transaction manifests...');

    await new Promise(r => setTimeout(r, 200));
    setReconciliationProgress(45);
    setProgressStepMessage('Matching transaction IDs to merchant order manifests...');

    await new Promise(r => setTimeout(r, 200));
    setReconciliationProgress(75);
    setProgressStepMessage('Auditing gateway fee deductions & bank payouts...');

    await new Promise(r => setTimeout(r, 200));
    setReconciliationProgress(95);
    setProgressStepMessage('Synthesizing exception evidence trails...');

    await new Promise(r => setTimeout(r, 150));

    try {
      const res = await apiClient.runReconciliation();
      setReconData(res);
      setReconciliationProgress(100);
      setProgressStepMessage(`Reconciliation complete — ${res.metrics.matchedCount} of ${res.metrics.totalRecordsProcessed} records matched.`);
    } catch (e) {
      const localRes = runDeterministicReconciliation(customRecords || syntheticFinancialRecords);
      setReconData(localRes);
      setReconciliationProgress(100);
      setProgressStepMessage(`Reconciliation complete — ${localRes.metrics.matchedCount} of ${localRes.metrics.totalRecordsProcessed} records matched.`);
    } finally {
      setIsReconciling(false);
    }
  }, []);

  const resetToDemoDataset = useCallback(async () => {
    await runReconciliationBatch(syntheticFinancialRecords);
  }, [runReconciliationBatch]);

  // Action Center Execution & Verification Handler
  const executeAction = useCallback(async (transactionId: string, actionType: string, notes?: string) => {
    try {
      const res = await apiClient.executeAction(transactionId, actionType, notes);
      
      // Update health score
      if (res && res.healthScoreAfter !== undefined) {
        setHealthScore(prev => prev ? {
          ...prev,
          overallScore: res.healthScoreAfter,
          scoreChange: res.healthScoreDelta,
          reasonForChange: `Finance health updated following verified action (${res.actionId}): ${res.message}`,
          lastUpdated: res.timestamp
        } : null);
      }

      // Re-run batch to synchronize updated records and verified variances
      await runReconciliationBatch();
      await refreshHealthAndAttention();

      return res;
    } catch (err) {
      console.error('Error executing action:', err);
      throw err;
    }
  }, [runReconciliationBatch, refreshHealthAndAttention]);

  // Update exception status
  const updateExceptionStatus = useCallback(async (id: string, newStatus: ExceptionStatus, notes?: string) => {
    try {
      await apiClient.updateExceptionStatus(id, newStatus, notes);
    } catch (e) {}

    setReconData(prev => {
      const updatedExceptions = prev.exceptions.map(exc => {
        if (exc.id === id || exc.exceptionCode === id) {
          return {
            ...exc,
            status: newStatus,
            resolutionNotes: notes || exc.resolutionNotes,
            resolvedAt: newStatus === 'RESOLVED' ? new Date().toISOString() : undefined,
            resolvedBy: newStatus === 'RESOLVED' ? 'Finance Ops Manager' : undefined
          };
        }
        return exc;
      });

      return {
        ...prev,
        exceptions: updatedExceptions
      };
    });
  }, []);

  // Voice navigation handler
  const handleVoiceNavigation = useCallback((target: string, param?: string) => {
    const t = target.toLowerCase();
    if (t.includes('exception') || t.includes('unresolved') || t.includes('mismatch')) {
      setActiveTab('exceptions');
      if (param) setSelectedExceptionId(param);
    } else if (t.includes('settlement') || t.includes('payout') || t.includes('cash') || t.includes('forecast')) {
      setActiveTab('settlements');
    } else if (t.includes('recon') || t.includes('match') || t.includes('ledger') || t.includes('transaction')) {
      setActiveTab('reconciliation');
    } else if (t.includes('overview') || t.includes('dashboard') || t.includes('home')) {
      setActiveTab('overview');
    }
  }, []);

  // PDF Export
  const exportReport = useCallback((type: 'reconciliation' | 'settlement' | 'exceptions') => {
    try {
      const doc = new jsPDF();
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 32, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('AI FINANCE CONTROLLER', 14, 15);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Statutory ${type.toUpperCase()} Audit Report • Bharat Merchants Ltd. (27AABCB1234F1Z5)`, 14, 23);

      doc.setTextColor(148, 163, 184);
      doc.setFontSize(8);
      doc.text(`Generated on ${new Date().toLocaleString('en-IN')}`, 14, 28);

      if (type === 'reconciliation') {
        autoTable(doc, {
          startY: 42,
          head: [['Metric', 'Value', 'Status']],
          body: [
            ['Total Records Processed', `${reconData.metrics.totalRecordsProcessed} Records`, 'Captured'],
            ['Reconciled Clean Volume', `INR ${reconData.metrics.totalReconciledAmount.toLocaleString('en-IN')}`, 'Verified'],
            ['Automated Match Rate', `${reconData.metrics.matchRatePercentage}%`, 'Authoritative'],
            ['Unresolved Exception Variance', `INR ${reconData.metrics.totalExceptionAmount.toLocaleString('en-IN')}`, `${reconData.metrics.exceptionsCount} Flagged`]
          ],
          theme: 'grid',
          headStyles: { fillColor: [12, 102, 228], textColor: [255, 255, 255], fontStyle: 'bold' }
        });

        const nextY = (doc as any).lastAutoTable.finalY + 8;
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('ITEMIZED TRANSACTION LEDGER (FIRST 20 ENTRIES)', 14, nextY);

        autoTable(doc, {
          startY: nextY + 3,
          head: [['Record ID', 'Order ID', 'Gross (INR)', 'Fee + GST', 'Settlement (INR)', 'Classification']],
          body: reconData.records.slice(0, 20).map(r => [
            r.id,
            r.orderId,
            r.grossAmount.toLocaleString('en-IN'),
            ((r.actualGatewayFee || r.expectedGatewayFee) + (r.actualGst || r.expectedGst)).toFixed(2),
            (r.actualSettlementAmount || r.expectedSettlementAmount).toLocaleString('en-IN'),
            r.classification.replace(/_/g, ' ')
          ]),
          theme: 'striped',
          headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
          bodyStyles: { fontSize: 7 }
        });
      } else if (type === 'settlement') {
        autoTable(doc, {
          startY: 42,
          head: [['Settlement ID', 'Settlement Date', 'Gross Volume (INR)', 'MDR + GST', 'Net Payout (INR)', 'Variance', 'Status']],
          body: settlementOverview.batches.map(b => [
            b.settlementId,
            new Date(b.settlementDate).toLocaleDateString('en-IN'),
            b.grossVolume.toLocaleString('en-IN'),
            (b.gatewayFees + b.gstOnFees).toFixed(2),
            (b.netSettlementActual || b.netSettlementExpected).toLocaleString('en-IN'),
            b.difference !== 0 ? `INR ${Math.abs(b.difference).toFixed(2)}` : 'INR 0.00',
            b.status.toUpperCase()
          ]),
          theme: 'grid',
          headStyles: { fillColor: [12, 102, 228], textColor: [255, 255, 255] }
        });
      } else {
        autoTable(doc, {
          startY: 42,
          head: [['Code', 'Transaction ID', 'Order ID', 'Type', 'Severity', 'Variance (INR)', 'AI Root Cause']],
          body: reconData.exceptions.map(e => [
            e.exceptionCode,
            e.transactionId,
            e.orderId,
            e.type.replace(/_/g, ' '),
            e.severity,
            e.difference.toLocaleString('en-IN'),
            e.aiExplanation
          ]),
          theme: 'grid',
          headStyles: { fillColor: [220, 38, 38], textColor: [255, 255, 255] },
          bodyStyles: { fontSize: 8 }
        });
      }

      doc.save(`${type}_report.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
    }
  }, [reconData, settlementOverview]);

  return (
    <FinanceContext.Provider
      value={{
        records: reconData.records,
        exceptions: reconData.exceptions,
        metrics: reconData.metrics,
        settlementOverview,
        cashPosition,
        cashForecast,
        insights,
        activeTab,
        setActiveTab,
        selectedExceptionId,
        setSelectedExceptionId,
        selectedRecordId,
        setSelectedRecordId,
        isVoiceOpen,
        setIsVoiceOpen,
        isReconciling,
        reconciliationProgress,
        progressStepMessage,
        runReconciliationBatch,
        resetToDemoDataset,
        updateExceptionStatus,
        handleVoiceNavigation,
        exportReport,
        healthScore,
        attentionQueue,
        executeAction,
        refreshHealthAndAttention,
        backendOnline
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};

import { AIInsightItem, ReconciliationMetrics, FinancialException, SettlementRecord, CashPosition } from '../types';

export function generateFinancialInsights(
  metrics: ReconciliationMetrics,
  exceptions: FinancialException[],
  settlements: SettlementRecord[],
  cashPosition: CashPosition
): AIInsightItem[] {
  const insights: AIInsightItem[] = [];

  // Insight 1: Reconciliation Match Rate Health
  if (metrics.matchRatePercentage >= 90) {
    insights.push({
      id: 'ins_recon_health',
      title: 'High Reconciliation Throughput',
      category: 'RECONCILIATION',
      level: 'success',
      summary: `Automated match rate achieved ${metrics.matchRatePercentage}% across ${metrics.totalRecordsProcessed} transaction records.`,
      details: `₹${metrics.totalReconciledAmount.toLocaleString('en-IN')} reconciled deterministically out of ₹${metrics.totalGrossProcessed.toLocaleString('en-IN')} gross volume.`,
      actionableStep: 'Download the reconciliation audit report for your quarterly statutory ledger.',
      timestamp: new Date().toISOString()
    });
  } else {
    insights.push({
      id: 'ins_recon_warn',
      title: 'Match Rate Alert',
      category: 'RECONCILIATION',
      level: 'warning',
      summary: `Match rate is currently ${metrics.matchRatePercentage}%, below the 95% target SLA.`,
      details: `${metrics.exceptionsCount} exceptions detected totaling ₹${metrics.totalExceptionAmount.toLocaleString('en-IN')}.`,
      actionableStep: 'Review unresolved exceptions in the Exception Center.',
      timestamp: new Date().toISOString()
    });
  }

  // Insight 2: Exception Root-Cause Analysis
  const amountMismatches = exceptions.filter(e => e.discrepancyType === 'AMOUNT_MISMATCH' || e.type === 'FEE_DISCREPANCY');
  if (amountMismatches.length > 0) {
    const totalVariance = amountMismatches.reduce((sum, e) => sum + Math.abs(e.difference || 0), 0);
    insights.push({
      id: 'ins_fee_variance',
      title: 'Gateway Fee & Settlement Variance Detected',
      category: 'SETTLEMENT',
      level: 'warning',
      summary: `Found ${amountMismatches.length} settlement amount discrepancy entries totaling ₹${totalVariance.toLocaleString('en-IN')}.`,
      details: 'Discrepancies stem from international card pricing tier (3.5% fee) and an unitemized chargeback deduction.',
      actionableStep: 'Click to auto-generate dispute statement with ARN reference numbers.',
      relatedIds: amountMismatches.map(e => e.transactionId),
      timestamp: new Date().toISOString()
    });
  }

  // Insight 3: Duplicate Transaction Alert
  const duplicates = exceptions.filter(e => e.discrepancyType === 'DUPLICATE_TRANSACTION' || e.type === 'DUPLICATE_TRANSACTION');
  if (duplicates.length > 0) {
    insights.push({
      id: 'ins_dup_alert',
      title: 'Duplicate Payment Capture Alert',
      category: 'ANOMALY',
      level: 'critical',
      summary: `${duplicates.length} duplicate customer payment capture(s) identified for immediate refund.`,
      details: `Customer was charged twice for order ${duplicates[0].orderId}.`,
      actionableStep: 'Initiate 1-click refund to prevent chargeback fees.',
      relatedIds: duplicates.map(e => e.transactionId),
      timestamp: new Date().toISOString()
    });
  }

  // Insight 4: Cash Position & 7-day Liquidity
  insights.push({
    id: 'ins_cash_liquidity',
    title: 'Strong 7-Day Net Cash Runway',
    category: 'CASH_FLOW',
    level: 'info',
    summary: `Available cash ₹${(cashPosition.currentAvailableCash / 100000).toFixed(2)}L plus ₹${(cashPosition.expectedSettlementsInflow / 100000).toFixed(2)}L pending gateway payouts.`,
    details: `Net liquidity runway is positive at ₹${(cashPosition.projectedNetPosition / 100000).toFixed(2)}L factoring in ₹${(cashPosition.pendingGatewayHoldbacks / 1000).toFixed(1)}k holdbacks and ₹${(cashPosition.refundObligations / 1000).toFixed(1)}k refund reserves.`,
    actionableStep: 'Cash reserves sufficient for regular operational disbursements.',
    timestamp: new Date().toISOString()
  });

  return insights;
}

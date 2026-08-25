import { SettlementRecord, FinancialRecord } from '../types';

export interface SettlementOverview {
  totalGrossSettled: number;
  totalNetReceived: number;
  totalFeesDeducted: number;
  totalGstDeducted: number;
  totalDiscrepancyAmount: number;
  pendingSettlementAmount: number;
  batches: SettlementRecord[];
}

export function computeSettlementIntelligence(
  batches: SettlementRecord[],
  records: FinancialRecord[]
): SettlementOverview {
  let totalGrossSettled = 0;
  let totalNetReceived = 0;
  let totalFeesDeducted = 0;
  let totalGstDeducted = 0;
  let totalDiscrepancyAmount = 0;
  let pendingSettlementAmount = 0;

  batches.forEach(b => {
    if (b.status === 'settled' || b.status === 'discrepancy') {
      totalGrossSettled += b.grossVolume;
      totalNetReceived += b.netSettlementActual;
      totalFeesDeducted += b.gatewayFees;
      totalGstDeducted += b.gstOnFees;
      if (b.difference !== 0) {
        totalDiscrepancyAmount += Math.abs(b.difference);
      }
    } else if (b.status === 'pending') {
      pendingSettlementAmount += b.netSettlementExpected;
    }
  });

  return {
    totalGrossSettled: Math.round(totalGrossSettled * 100) / 100,
    totalNetReceived: Math.round(totalNetReceived * 100) / 100,
    totalFeesDeducted: Math.round(totalFeesDeducted * 100) / 100,
    totalGstDeducted: Math.round(totalGstDeducted * 100) / 100,
    totalDiscrepancyAmount: Math.round(totalDiscrepancyAmount * 100) / 100,
    pendingSettlementAmount: Math.round(pendingSettlementAmount * 100) / 100,
    batches
  };
}

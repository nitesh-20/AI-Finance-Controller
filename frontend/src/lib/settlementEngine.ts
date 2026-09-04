import { SettlementRecord, SettlementOverview } from '../types';

export function aggregateSettlementOverview(settlements: SettlementRecord[]): SettlementOverview {
  let totalGross = 0;
  let totalSettled = 0;
  let pendingAmount = 0;
  let totalFees = 0;
  let totalTax = 0;
  let discrepanciesCount = 0;
  let totalDiscrepancyAmount = 0;

  for (const s of settlements) {
    totalGross += (s.grossAmount || s.grossVolume || 0);
    if (s.status === 'PROCESSED' || s.status === 'settled' || s.status === 'DISCREPANCY' || s.status === 'discrepancy') {
      totalSettled += (s.netSettlementAmount || s.netSettlementActual || 0);
      totalFees += (s.totalFees || s.gatewayFees || 0);
      totalTax += (s.totalTax || s.gstOnFees || 0);
      if (s.varianceAmount || s.difference) {
        discrepanciesCount++;
        totalDiscrepancyAmount += Math.abs(s.varianceAmount || s.difference || 0);
      }
    } else if (s.status === 'PENDING' || s.status === 'pending') {
      pendingAmount += (s.netSettlementAmount || s.netSettlementExpected || 0);
    }
  }

  return {
    totalGrossSettled: totalGross,
    totalNetReceived: totalSettled,
    totalSettledAmount: totalSettled,
    pendingSettlementAmount: pendingAmount,
    totalFeesDeducted: totalFees,
    totalGstDeducted: totalTax,
    totalTaxDeducted: totalTax,
    settlementDiscrepanciesCount: discrepanciesCount,
    totalDiscrepancyAmount: totalDiscrepancyAmount,
    nextSettlementDate: '2026-03-26'
  };
}


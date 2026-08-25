import { CashPosition, CashForecastDay, SettlementRecord, FinancialRecord } from '../types';

export function calculateCashPosition(
  baseAvailableCash: number = 246500,
  settlements: SettlementRecord[],
  records: FinancialRecord[]
): { currentPosition: CashPosition; forecast: CashForecastDay[] } {
  // Pending inflows from gateway
  const expectedSettlementsInflow = settlements
    .filter(s => s.status === 'pending')
    .reduce((sum, s) => sum + s.netSettlementExpected, 0);

  // Pending gateway holdbacks (discrepancy amounts under dispute)
  const pendingGatewayHoldbacks = settlements
    .filter(s => s.status === 'discrepancy')
    .reduce((sum, s) => sum + Math.abs(s.difference), 0);

  // Refund obligations (estimated 1.5% of gross volume buffer)
  const refundObligations = 12500;

  const projectedNetPosition = baseAvailableCash + expectedSettlementsInflow - refundObligations;

  const currentPosition: CashPosition = {
    currentAvailableCash: baseAvailableCash,
    expectedSettlementsInflow: Math.round(expectedSettlementsInflow * 100) / 100,
    pendingGatewayHoldbacks: Math.round(pendingGatewayHoldbacks * 100) / 100,
    refundObligations,
    projectedNetPosition: Math.round(projectedNetPosition * 100) / 100,
    lastUpdated: new Date().toISOString()
  };

  // Generate 7-day forward forecast
  const forecast: CashForecastDay[] = [];
  const days = ['Today', 'Tomorrow', '+2 Days', '+3 Days', '+4 Days', '+5 Days', '+6 Days'];
  let rollingBalance = baseAvailableCash;

  const dailyInflows = [
    expectedSettlementsInflow * 0.7, // Day 0/1: T+1 payout
    expectedSettlementsInflow * 0.3 + 45000,
    52000,
    61000,
    48000,
    73000,
    68000
  ];

  const dailyOutflows = [
    2500, // Today refunds / operating expenses
    18000, // Supplier invoice
    12000,
    8000,
    14000,
    9500,
    11000
  ];

  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    
    const inflow = dailyInflows[i];
    const outflow = dailyOutflows[i];
    rollingBalance = rollingBalance + inflow - outflow;

    forecast.push({
      date: dateStr,
      dayLabel: days[i],
      projectedInflow: Math.round(inflow),
      projectedOutflow: Math.round(outflow),
      projectedClosingBalance: Math.round(rollingBalance),
      confidenceScore: Math.max(78, 98 - i * 3) // Confidence decreases slightly further out
    });
  }

  return { currentPosition, forecast };
}

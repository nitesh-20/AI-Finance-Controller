import { SettlementRecord, FinancialException, CashPosition, CashForecastDay } from '../types';

export function calculateLiveCashPosition(
  baseAvailableCash: number,
  settlements: SettlementRecord[],
  exceptions: FinancialException[]
): CashPosition {
  const pendingInflows = settlements
    .filter(s => s.status === 'PENDING' || s.status === 'pending')
    .reduce((sum, s) => sum + (s.netSettlementAmount || s.netSettlementExpected || 0), 0);

  const holdbacks = settlements
    .filter(s => s.status === 'DISCREPANCY' || s.status === 'discrepancy')
    .reduce((sum, s) => sum + Math.abs(s.varianceAmount || s.difference || 0), 0);

  const refundObligations = exceptions
    .filter(e => e.discrepancyType === 'DUPLICATE_TRANSACTION' || e.type === 'DUPLICATE_TRANSACTION')
    .reduce((sum, e) => sum + (e.actualAmount || 0), 0);

  const projectedNet = baseAvailableCash + pendingInflows - holdbacks - refundObligations;

  return {
    currentAvailableCash: baseAvailableCash,
    expectedSettlementsInflow: pendingInflows,
    pendingGatewayHoldbacks: holdbacks,
    refundObligations: refundObligations,
    projectedNetPosition: projectedNet,
    lastUpdated: new Date().toISOString()
  };
}

export function generate7DayForecast(currentCash: number): CashForecastDay[] {
  const days: CashForecastDay[] = [];
  const today = new Date();
  let balance = currentCash;

  const mockPlan = [
    { label: 'Today', inflow: 342000, outflow: 45000, conf: 0.98 },
    { label: 'Tomorrow', inflow: 285000, outflow: 80000, conf: 0.95 },
    { label: 'Day +2', inflow: 310000, outflow: 30000, conf: 0.92 },
    { label: 'Day +3', inflow: 240000, outflow: 120000, conf: 0.88 },
    { label: 'Day +4', inflow: 195000, outflow: 25000, conf: 0.85 },
    { label: 'Day +5', inflow: 220000, outflow: 40000, conf: 0.82 },
    { label: 'Day +6', inflow: 260000, outflow: 60000, conf: 0.80 }
  ];

  for (let i = 0; i < mockPlan.length; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const plan = mockPlan[i];
    balance = balance + plan.inflow - plan.outflow;

    days.push({
      date: d.toISOString().slice(0, 10),
      dayLabel: plan.label,
      projectedInflow: plan.inflow,
      projectedOutflow: plan.outflow,
      projectedClosingBalance: balance,
      confidenceScore: plan.conf
    });
  }

  return days;
}

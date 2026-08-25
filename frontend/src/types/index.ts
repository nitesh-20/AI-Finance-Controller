export type UserRole = 'merchant' | 'customer' | 'finance_manager';

export interface UserProfile {
  uid: string;
  name: string;
  role: UserRole;
  businessName?: string;
  gstin?: string;
  createdAt: string;
}

export type PaymentMethod = 'UPI' | 'Credit Card' | 'Debit Card' | 'NetBanking' | 'Wallet';
export type PaymentStatus = 'success' | 'failed' | 'pending' | 'refunded';
export type SettlementStatus = 'settled' | 'pending' | 'hold' | 'discrepancy' | 'failed';

export interface FinancialRecord {
  id: string;
  transactionId: string;
  orderId: string;
  settlementId?: string;
  timestamp: string;
  customerName: string;
  paymentMethod: PaymentMethod;
  grossAmount: number;
  expectedGatewayFee: number;
  expectedGst: number;
  expectedSettlementAmount: number;
  actualSettlementAmount?: number;
  actualGatewayFee?: number;
  actualGst?: number;
  status: PaymentStatus;
  settlementStatus: SettlementStatus;
  settlementDate?: string;
  batchId?: string;
  arnNumber?: string;
  notes?: string;
  isRefund?: boolean;
  refundAmount?: number;
}

export type MatchClassification = 
  | 'MATCHED'
  | 'PARTIAL_MATCH'
  | 'AMOUNT_MISMATCH'
  | 'MISSING_SETTLEMENT'
  | 'MISSING_TRANSACTION'
  | 'DUPLICATE_TRANSACTION'
  | 'DATE_MISMATCH'
  | 'REFERENCE_MISMATCH'
  | 'FEE_DISCREPANCY'
  | 'UNRESOLVED_EXCEPTION';

export type ExceptionSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ExceptionStatus = 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'UNABLE_TO_RESOLVE';

export interface AuditWaterfall {
  grossAmount: number;
  contractedMdrRate: number;
  mdrAmount: number;
  gstRate: number;
  gstOnMdr: number;
  tdsRate: number;
  tdsAmount: number;
  theoreticalNetSettlement: number;
  actualNetSettled: number;
  variance: number;
}

export interface AuditTrailStep {
  stepNumber: number;
  title: string;
  description: string;
  status: 'COMPLETED' | 'FLAGGED' | 'SKIPPED';
  timestamp: string;
  meta?: Record<string, any>;
}

export interface TransactionAuditResult {
  transactionId: string;
  orderId: string;
  customerName: string;
  paymentMethod: string;
  reconciliationStatus: 'MATCHED' | 'DISCREPANCY' | 'PENDING';
  varianceAmount: number;
  rootCause: string;
  confidenceScore: number;
  whyFlagged: string;
  recommendedAction: 'RECONCILE_CLEAN' | 'DISPUTE_RAZORPAY' | 'JOURNAL_ADJUSTMENT' | 'QUARANTINE' | 'REFUND_DUPLICATE' | 'MONITOR_INFLOW';
  waterfall: AuditWaterfall;
  evidence: string[];
  auditSteps: AuditTrailStep[];
  actionTaken?: string;
  auditedAt: string;
}

export interface FinanceHealthScore {
  overallScore: number;
  reconciliationScore: number;
  settlementScore: number;
  exceptionScore: number;
  cashPositionScore: number;
  previousScore: number;
  scoreChange: number;
  reasonForChange: string;
  lastUpdated: string;
}

export interface AttentionItem {
  id: string;
  transactionId: string;
  orderId: string;
  customerName: string;
  amount: number;
  title: string;
  category: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  impactLevel: string;
  daysUnresolved: number;
  confidence: number;
  recommendation: string;
  actionType: 'DISPUTE_RAZORPAY' | 'JOURNAL_ADJUSTMENT' | 'QUARANTINE' | 'REFUND_DUPLICATE' | 'MARK_RESOLVED';
  suggestedActionLabel: string;
}

export interface VerificationResult {
  isVerified: boolean;
  previousStatus: string;
  newStatus: string;
  previousVariance: number;
  newVariance: number;
  varianceCleared: number;
  verificationMessage: string;
}

export interface ActionExecutionResponse {
  success: boolean;
  actionId: string;
  transactionId: string;
  actionType: string;
  timestamp: string;
  message: string;
  healthScoreBefore: number;
  healthScoreAfter: number;
  healthScoreDelta: number;
  auditEventId: string;
  verification: VerificationResult;
}

export interface FinancialException {
  id: string;
  exceptionCode: string; // e.g. "EX-101"
  recordId: string;
  transactionId: string;
  orderId: string;
  settlementId?: string;
  type: MatchClassification;
  severity: ExceptionSeverity;
  status: ExceptionStatus;
  expectedAmount: number;
  actualAmount: number;
  difference: number;
  detectedAt: string;
  aiExplanation: string;
  suggestedAction: string;
  resolutionNotes?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  evidence: {
    orderAmount: number;
    paymentCapturedAmount: number;
    expectedFee: number;
    actualFeeDeducted?: number;
    settlementAmountReceived?: number;
    gatewayStatus?: string;
    timestampDiscrepancyHours?: number;
    rawTrace?: Record<string, any>;
  };
}

export interface SettlementRecord {
  settlementId: string;
  settlementDate: string;
  grossVolume: number;
  totalTransactions: number;
  gatewayFees: number;
  gstOnFees: number;
  refundsDeducted: number;
  adjustments: number;
  netSettlementExpected: number;
  netSettlementActual: number;
  difference: number;
  status: SettlementStatus;
  utrNumber?: string;
  bankAccountLast4: string;
  discrepanciesCount: number;
  discrepancyReason?: string;
}

export interface ReconciliationMetrics {
  totalRecordsProcessed: number;
  matchedCount: number;
  partialCount: number;
  unmatchedCount: number;
  exceptionsCount: number;
  matchRatePercentage: number;
  totalGrossProcessed: number;
  totalReconciledAmount: number;
  totalExceptionAmount: number;
  totalFeesPaid: number;
  processingDurationMs: number;
  batchTimestamp: string;
}

export interface CashPosition {
  currentAvailableCash: number;
  expectedSettlementsInflow: number;
  pendingGatewayHoldbacks: number;
  refundObligations: number;
  projectedNetPosition: number;
  lastUpdated: string;
}

export interface CashForecastDay {
  date: string;
  dayLabel: string;
  projectedInflow: number;
  projectedOutflow: number;
  projectedClosingBalance: number;
  confidenceScore: number;
}

export interface AIInsightItem {
  id: string;
  title: string;
  category: 'RECONCILIATION' | 'SETTLEMENT' | 'CASH_FLOW' | 'ANOMALY';
  level: 'info' | 'warning' | 'critical' | 'success';
  summary: string;
  details: string;
  actionableStep?: string;
  relatedIds?: string[];
  timestamp: string;
}

// Legacy compatibility for existing voice/chat components
export interface Transaction {
  id?: string;
  userId?: string;
  merchantId?: string;
  customerId?: string;
  amount: number;
  type: 'Received' | 'Paid' | 'Cashback' | 'Self Transfer';
  category: string;
  status: 'success' | 'failed' | 'pending';
  timestamp: string;
  referenceId: string;
  merchantName?: string;
  customerName?: string;
  payment_method?: string;
  currency?: string;
  failure_reason?: string;
  description?: string;
  location?: string;
  items?: { name: string; qty: number; price: number }[];
  [key: string]: any;
}

export interface InventoryItem {
  id: string;
  name: string;
  price: number;
  stock: number;
  unit: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  lastSold?: string;
  restockThreshold?: number;
}

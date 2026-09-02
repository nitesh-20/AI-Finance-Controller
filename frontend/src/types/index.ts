export type UserRole = 'merchant' | 'customer' | 'finance_manager';

export type PaymentMethod = 'UPI' | 'Credit Card' | 'Debit Card' | 'NetBanking' | 'Wallet';
export type PaymentStatus = 'success' | 'failed' | 'pending' | 'refunded';
export type SettlementStatus = 'settled' | 'pending' | 'hold' | 'discrepancy' | 'failed';

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

export interface AuditWaterfall {
  grossAmount: number;
  contractedMdrRate: number;
  mdrAmount: number;
  gstRate: number;
  gstAmount: number;
  tdsRate: number;
  tdsAmount: number;
  refundAmount: number;
  chargebackAmount: number;
  otherDeductions: number;
  theoreticalNetSettlement: number;
  actualBankCredit: number;
  variance: number;
}

export interface VerificationResult {
  verificationStatus: 'VERIFIED' | 'REJECTED' | 'QUARANTINED';
  expectedAmount: number;
  actualAmount: number;
  variance: number;
  checksPassed: string[];
  checksFailed: string[];
  verifiedAt: string;
}

export interface AIProposal {
  proposalType: string;
  candidateRecords: string[];
  reasoning: string;
  evidence: string[];
  confidence: number;
  proposedNet: number;
  suggestedAction: string;
}

export interface ThreeWayReconciliationRecord {
  transaction_id: string;
  utr: string;
  order_id: string;
  invoice_id: string;
  merchant_name: string;
  customer_name: string;
  gross_amount: number;
  mdr: number;
  gst_on_mdr: number;
  refund: number;
  chargeback: number;
  tds: number;
  other_deductions: number;
  expected_settlement: number;
  actual_bank_credit: number;
  variance: number;
  settlement_date: string;
  bank_date?: string;
  ledger_date?: string;
  current_status: string;
  match_method: string;
  verification_status: string;
  ai_proposal?: AIProposal;
  verification_result?: VerificationResult;
  waterfall?: AuditWaterfall;
  root_cause?: string;
  evidence: string[];
  recommended_action?: string;
}

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

export type ExceptionSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ExceptionStatus = 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'UNABLE_TO_RESOLVE';

export interface FinancialException {
  id: string;
  transactionId: string;
  orderId: string;
  settlementId?: string;
  timestamp?: string;
  customerName?: string;
  paymentMethod?: PaymentMethod;
  severity: ExceptionSeverity;
  status: ExceptionStatus;
  discrepancyType?: string;
  type?: string;
  expectedAmount: number;
  actualAmount: number;
  difference: number;
  rootCause?: string;
  assignedTo?: string;
  resolutionNotes?: string;
  evidence?: Record<string, any>;
  [key: string]: any;
}

export interface SettlementRecord {
  id?: string;
  batchId?: string;
  settlementId?: string;
  settlementDate: string;
  periodStart?: string;
  periodEnd?: string;
  totalGrossAmount?: number;
  totalFees?: number;
  totalTax?: number;
  netSettlementAmount?: number;
  transactionCount?: number;
  status: 'PROCESSED' | 'PENDING' | 'DISCREPANCY' | 'settled' | 'pending' | 'discrepancy';
  utrNumber?: string;
  bankAccount?: string;
  varianceAmount?: number;
  grossVolume?: number;
  netSettlementActual?: number;
  netSettlementExpected?: number;
  gatewayFees?: number;
  gstOnFees?: number;
  difference?: number;
  [key: string]: any;
}

export interface SettlementOverview {
  totalGrossSettled: number;
  totalNetReceived: number;
  totalSettledAmount?: number;
  pendingSettlementAmount: number;
  totalFeesDeducted: number;
  totalGstDeducted: number;
  totalTaxDeducted?: number;
  settlementDiscrepanciesCount?: number;
  totalDiscrepancyAmount: number;
  nextSettlementDate?: string;
  batches?: SettlementRecord[];
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

export interface AuditTimelineEvent {
  timestamp: string;
  transaction_id: string;
  utr?: string;
  step_name: string;
  rule_or_model: string;
  input_values?: Record<string, any>;
  calculated_values?: Record<string, any>;
  ai_proposal?: Record<string, any>;
  verifier_result?: Record<string, any>;
  final_decision: string;
  human_approved?: boolean;
  details: string;
}

export interface BenchmarkMetrics {
  total_records: number;
  auto_matched_count: number;
  ai_assisted_count: number;
  exceptions_count: number;
  auto_match_rate_pct: number;
  verification_pass_rate_pct: number;
  precision_pct: number;
  wrong_auto_posts: number;
  median_processing_ms: number;
  total_processing_sec: number;
  estimated_ai_cost_usd: number;
  cost_per_100_records_usd: number;
}

export interface SystemComparison {
  system_name: string;
  total_records: number;
  match_rate_pct: number;
  incorrect_postings_count: number;
  honest_exceptions_count: number;
  precision_pct: number;
  risk_profile: string;
  verdict: string;
}

export interface BenchmarkComparisonResponse {
  naive_ai_baseline: SystemComparison;
  ai_finance_controller: SystemComparison;
  metrics: BenchmarkMetrics;
  summary_message: string;
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

export interface TransactionAuditResult {
  transactionId: string;
  classification: string;
  confidenceScore: number;
  ruleApplied: string;
  varianceAmount: number;
  diagnosedRootCause: string;
  auditSteps: {
    stepNumber: number;
    title: string;
    description: string;
    calculatedValue: string;
    expectedValue: string;
    status: 'PASSED' | 'FLAGGED' | 'INFO';
  }[];
  recommendedAction: string;
}

export interface AttentionItem {
  id: string;
  transactionId: string;
  type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  amount: number;
  suggestedAction: string;
  actionPayload: Record<string, any>;
  timestamp: string;
}

export interface ActionExecutionResponse {
  actionId: string;
  transactionId: string;
  actionType: string;
  status: string;
  message: string;
  healthScoreBefore: number;
  healthScoreAfter: number;
  timestamp: string;
}

export interface Transaction {
  id?: string;
  amount: number;
  type: 'Received' | 'Paid' | 'Cashback' | 'Self Transfer';
  category: string;
  status: 'success' | 'failed' | 'pending';
  timestamp: string;
  referenceId: string;
  merchantName?: string;
  customerName?: string;
}

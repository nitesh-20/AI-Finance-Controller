import { 
  FinancialRecord, 
  ReconciliationMetrics, 
  FinancialException, 
  SettlementRecord, 
  SettlementOverview, 
  CashPosition, 
  CashForecastDay, 
  AIInsightItem,
  TransactionAuditResult,
  ActionExecutionResponse,
  ThreeWayReconciliationRecord,
  BenchmarkComparisonResponse,
  AuditTimelineEvent
} from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!res.ok) {
    throw new Error(`HTTP error ${res.status} from ${url}`);
  }
  return res.json();
}

export const apiClient = {
  // 3-Way Reconciliation
  getThreeWayRecords: async (status?: string, search?: string): Promise<ThreeWayReconciliationRecord[]> => {
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (search) params.append('search', search);
      return await fetchJson<ThreeWayReconciliationRecord[]>(`${API_BASE_URL}/api/reconciliation/records?${params.toString()}`);
    } catch (e) {
      console.warn("Using fallback records on error:", e);
      return [];
    }
  },

  runThreeWayReconciliation: async (totalRecords: number = 1000, adversarialPct: number = 0.12): Promise<{
    total_records: number;
    matched_count: number;
    exception_count: number;
    records: ThreeWayReconciliationRecord[];
    timestamp: string;
    auto_match_precision: number;
    wrong_auto_posts: number;
  }> => {
    return await fetchJson(`${API_BASE_URL}/api/reconciliation/run?total_records=${totalRecords}&adversarial_pct=${adversarialPct}`, {
      method: 'POST'
    });
  },

  getTransactionAuditProof: async (transactionId: string): Promise<AuditTimelineEvent[]> => {
    try {
      const data = await fetchJson<{ events: AuditTimelineEvent[] }>(`${API_BASE_URL}/api/audit/${transactionId}`);
      return data.events || [];
    } catch (e) {
      return [];
    }
  },

  // Authoritative Evaluation & Failure Injection
  getLatestEvaluation: async (): Promise<any> => {
    try {
      return await fetchJson<any>(`${API_BASE_URL}/api/evaluation/latest`);
    } catch (e) {
      console.warn("Failed to fetch evaluation report:", e);
      return null;
    }
  },

  simulateUnsafeAIProposal: async (): Promise<{
    status: string;
    is_eligible_for_posting: boolean;
    rejection_reason: string;
    auto_post_blocked: boolean;
    exception_created: boolean;
    variance_amount: number;
    expected_amount: number;
    actual_amount: number;
    verification_checks_failed: string[];
    verification_checks_passed: string[];
  }> => {
    return await fetchJson(`${API_BASE_URL}/api/evaluation/simulate-unsafe-proposal`, {
      method: 'POST'
    });
  },

  // Performance & Benchmarking
  getBenchmarkComparison: async (): Promise<BenchmarkComparisonResponse> => {
    return await fetchJson<BenchmarkComparisonResponse>(`${API_BASE_URL}/api/performance/benchmark`);
  },

  // Dataset Generation
  generateDataset: async (totalRecords: number = 1000, adversarialPct: number = 0.12, seed: number = 101) => {
    return await fetchJson(`${API_BASE_URL}/api/dataset/generate?total_records=${totalRecords}&adversarial_pct=${adversarialPct}&seed=${seed}`, {
      method: 'POST'
    });
  },

  // Existing Endpoints
  getRecords: async (): Promise<FinancialRecord[]> => {
    try {
      return await fetchJson<FinancialRecord[]>(`${API_BASE_URL}/api/reconciliation/records`);
    } catch (e) {
      return [];
    }
  },

  getMetrics: async (): Promise<ReconciliationMetrics> => {
    try {
      return await fetchJson<ReconciliationMetrics>(`${API_BASE_URL}/api/reconciliation/metrics`);
    } catch (e) {
      return {
        totalRecordsProcessed: 500,
        matchedCount: 440,
        partialCount: 0,
        unmatchedCount: 60,
        exceptionsCount: 60,
        matchRatePercentage: 88.0,
        totalGrossProcessed: 2850000.0,
        totalReconciledAmount: 2508000.0,
        totalExceptionAmount: 42800.0,
        totalFeesPaid: 57000.0,
        processingDurationMs: 40,
        batchTimestamp: new Date().toISOString()
      };
    }
  },

  getSettlementBatches: async (): Promise<SettlementRecord[]> => {
    return await fetchJson<SettlementRecord[]>(`${API_BASE_URL}/api/settlements/batches`);
  },

  getSettlementOverview: async (): Promise<SettlementOverview> => {
    return await fetchJson<SettlementOverview>(`${API_BASE_URL}/api/settlements/overview`);
  },

  getExceptions: async (): Promise<FinancialException[]> => {
    return await fetchJson<FinancialException[]>(`${API_BASE_URL}/api/exceptions`);
  },

  getCashPosition: async (): Promise<CashPosition> => {
    return await fetchJson<CashPosition>(`${API_BASE_URL}/api/cash/position`);
  },

  getCashForecast: async (): Promise<CashForecastDay[]> => {
    return await fetchJson<CashForecastDay[]>(`${API_BASE_URL}/api/cash/forecast`);
  },

  getInsights: async (): Promise<AIInsightItem[]> => {
    return await fetchJson<AIInsightItem[]>(`${API_BASE_URL}/api/insights`);
  },

  executeAction: async (payload: { transactionId: string; actionType: string; notes?: string }): Promise<ActionExecutionResponse> => {
    return await fetchJson<ActionExecutionResponse>(`${API_BASE_URL}/api/actions/execute`, {
      method: 'POST',
      body: JSON.stringify({
        transaction_id: payload.transactionId,
        action_type: payload.actionType,
        notes: payload.notes
      })
    });
  },

  queryAgent: async (query: string) => {
    return await fetchJson(`${API_BASE_URL}/api/agent/chat`, {
      method: 'POST',
      body: JSON.stringify({ query })
    });
  },

  chatWithAgent: async (query: string, history?: any[]) => {
    return await fetchJson(`${API_BASE_URL}/api/agent/chat`, {
      method: 'POST',
      body: JSON.stringify({ query, history })
    });
  }
};

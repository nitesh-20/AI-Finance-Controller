const API_BASE = 'http://localhost:8000/api';

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 2000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export const apiClient = {
  // Reconciliation API
  runReconciliation: async () => {
    const res = await fetchWithTimeout(`${API_BASE}/reconciliation/run`);
    if (!res.ok) throw new Error('Failed to run reconciliation');
    return res.json();
  },

  getReconciliationMetrics: async () => {
    const res = await fetchWithTimeout(`${API_BASE}/reconciliation/metrics`);
    if (!res.ok) throw new Error('Failed to get metrics');
    return res.json();
  },

  getTransactionAudit: async (txnId: string) => {
    const res = await fetchWithTimeout(`${API_BASE}/reconciliation/audit/${txnId}`);
    if (!res.ok) throw new Error('Failed to get transaction audit');
    return res.json();
  },

  getAllTransactionAudits: async () => {
    const res = await fetchWithTimeout(`${API_BASE}/reconciliation/audits`);
    if (!res.ok) throw new Error('Failed to get all transaction audits');
    return res.json();
  },

  // Settlements API
  getSettlementOverview: async () => {
    const res = await fetchWithTimeout(`${API_BASE}/settlements`);
    if (!res.ok) throw new Error('Failed to get settlements');
    return res.json();
  },

  // Exceptions API
  getExceptions: async () => {
    const res = await fetchWithTimeout(`${API_BASE}/exceptions`);
    if (!res.ok) throw new Error('Failed to get exceptions');
    return res.json();
  },

  updateExceptionStatus: async (id: string, status: string, notes?: string) => {
    const res = await fetchWithTimeout(`${API_BASE}/exceptions/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, notes }),
    });
    if (!res.ok) throw new Error('Failed to update status');
    return res.json();
  },

  // Cash Position & Forecast
  getCashPosition: async () => {
    const res = await fetchWithTimeout(`${API_BASE}/cash/position`);
    if (!res.ok) throw new Error('Failed to get cash position');
    return res.json();
  },

  getCashForecast: async () => {
    const res = await fetchWithTimeout(`${API_BASE}/cash/forecast`);
    if (!res.ok) throw new Error('Failed to get cash forecast');
    return res.json();
  },

  // AI Financial Insights
  getInsights: async () => {
    const res = await fetchWithTimeout(`${API_BASE}/insights`);
    if (!res.ok) throw new Error('Failed to get insights');
    return res.json();
  },

  // Health Score & Attention API
  getFinanceHealthScore: async () => {
    const res = await fetchWithTimeout(`${API_BASE}/health-score`);
    if (!res.ok) throw new Error('Failed to get finance health score');
    return res.json();
  },

  getAttentionQueue: async () => {
    const res = await fetchWithTimeout(`${API_BASE}/health-score/attention`);
    if (!res.ok) throw new Error('Failed to get attention queue');
    return res.json();
  },

  // Action Center API
  executeAction: async (transactionId: string, actionType: string, notes?: string) => {
    const res = await fetchWithTimeout(`${API_BASE}/actions/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactionId, actionType, notes }),
    });
    if (!res.ok) throw new Error('Failed to execute action');
    return res.json();
  },

  resetDemoDataset: async () => {
    const res = await fetchWithTimeout(`${API_BASE}/actions/reset`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to reset demo dataset');
    return res.json();
  },

  // Agent Chat API
  sendAgentChat: async (query: string, conversationId?: string) => {
    const res = await fetchWithTimeout(`${API_BASE}/agent/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, conversation_id: conversationId }),
    });
    if (!res.ok) throw new Error('Failed to chat with agent');
    return res.json();
  },

  chatWithAgent: async (message: string, conversationId = 'conv_default') => {
    const res = await fetchWithTimeout(`${API_BASE}/agent/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: message, conversation_id: conversationId }),
    }, 3000);
    if (!res.ok) throw new Error('Failed to chat with agent');
    return res.json();
  },

  // Audit Trail
  getAuditLedger: async () => {
    const res = await fetchWithTimeout(`${API_BASE}/audit`);
    if (!res.ok) throw new Error('Failed to get audit ledger');
    return res.json();
  },

  // Report Summary
  getReportSummary: async () => {
    const res = await fetchWithTimeout(`${API_BASE}/reports/summary`);
    if (!res.ok) throw new Error('Failed to get report summary');
    return res.json();
  }
};

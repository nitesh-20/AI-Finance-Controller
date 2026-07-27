const fs = require('fs');

let code = fs.readFileSync('src/services/gemini.ts', 'utf-8');

// Insert mockData import
if (!code.includes('mockTransactions')) {
  code = code.replace(
    'import { Transaction } from "../types";',
    'import { Transaction } from "../types";\nimport { mockTransactions } from "../mockData";'
  );
}

// Override getTransactions 
code = code.replace(
  /export const getTransactions \= async \([\s\S]*?\}\;/m,
  `export const getTransactions = async (userId: string, role: 'merchant' | 'customer', days: number = 1): Promise<Transaction[]> => {
  const now = new Date();
  const startTime = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
  
  return mockTransactions.filter((t: Transaction) => t.timestamp >= startTime).sort((a: Transaction, b: Transaction) => b.timestamp.localeCompare(a.timestamp)).slice(0, 20);
};`
);

// Override getSummary
code = code.replace(
  /export const getSummary \= async \([\s\S]*?\}\;/m,
  `export const getSummary = async (userId: string, role: 'merchant' | 'customer', period: 'today' | 'week' | 'month' = 'today') => {
  const days = period === 'today' ? 1 : period === 'week' ? 7 : 30;
  const transactions = await getTransactions(userId, role, days);
  const total = transactions.reduce((sum: number, t: Transaction) => sum + (t.status === 'success' ? t.amount : 0), 0);
  return {
    total,
    count: transactions.length,
    period
  };
};`
);

// Override verifyPayment
code = code.replace(
  /export const verifyPayment \= async \([\s\S]*?\}\;/m,
  `export const verifyPayment = async (userId: string, amount: number, timeWindowMinutes: number = 10): Promise<Transaction[]> => {
  const startTime = new Date(new Date().getTime() - timeWindowMinutes * 60 * 1000).toISOString();
  
  return mockTransactions.filter((t: Transaction) => 
    t.amount === amount && 
    t.timestamp >= startTime && 
    t.status === 'success'
  ).sort((a: Transaction,b: Transaction) => b.timestamp.localeCompare(a.timestamp));
};`
);

// Override queryTransactions
code = code.replace(
  /export const queryTransactions \= async \([\s\S]*?\}\;/m,
  `export const queryTransactions = async (
  userId: string, 
  role: 'merchant' | 'customer', 
  filters: { 
    category?: string; 
    minAmount?: number; 
    maxAmount?: number; 
    days?: number;
    startDate?: string;
    endDate?: string;
    status?: 'success' | 'failed' | 'pending';
    referenceId?: string;
  }
): Promise<Transaction[]> => {
  let result = [...mockTransactions];

  if (filters.category) result = result.filter((t: Transaction) => t.category === filters.category);
  if (filters.status) result = result.filter((t: Transaction) => t.status === filters.status);
  if (filters.referenceId) result = result.filter((t: Transaction) => t.referenceId === filters.referenceId);
  if (filters.minAmount !== undefined) result = result.filter((t: Transaction) => t.amount >= filters.minAmount!);
  if (filters.maxAmount !== undefined) result = result.filter((t: Transaction) => t.amount <= filters.maxAmount!);

  let startT = filters.startDate;
  if (filters.days) {
    startT = new Date(new Date().getTime() - filters.days * 24 * 60 * 60 * 1000).toISOString();
  }
  
  if (startT) result = result.filter((t: Transaction) => t.timestamp >= startT!);
  if (filters.endDate) result = result.filter((t: Transaction) => t.timestamp <= filters.endDate!);

  return result.sort((a: Transaction,b: Transaction) => b.timestamp.localeCompare(a.timestamp));
};`
);

fs.writeFileSync('src/services/gemini.ts', code);
console.log("Re-wrote Gemini service to use Mock Transactions exclusively!");

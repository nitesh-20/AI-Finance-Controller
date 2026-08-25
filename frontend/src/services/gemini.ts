import { GoogleGenAI, Modality, LiveServerMessage, Type } from "@google/genai";
import { FinancialRecord, Transaction } from "../types";
import { syntheticFinancialRecords, syntheticSettlementBatches } from "../data/financialDataset";
import { runDeterministicReconciliation } from "../lib/reconciliationEngine";

const getAI = () => {
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (window as any).__ENV__?.VITE_GEMINI_API_KEY || '';
  if (!apiKey) {
    console.warn("Gemini API Key is missing! Please set VITE_GEMINI_API_KEY in your environment.");
  }
  return new GoogleGenAI({ apiKey });
};

// Map synthetic financial records to legacy transaction interface for fallback querying
const inMemoryTransactions: Transaction[] = syntheticFinancialRecords.map((r) => ({
  id: r.id,
  amount: r.grossAmount,
  type: 'Received',
  category: r.paymentMethod === 'UPI' ? 'Digital Payout' : 'Card Collection',
  status: r.status === 'success' ? 'success' : 'failed',
  timestamp: r.timestamp,
  merchantName: 'Razorpay Merchant Store',
  customerName: r.customerName,
  referenceId: r.transactionId
}));

export const getTransactions = async (userId: string, role: 'merchant' | 'customer', days: number = 1): Promise<Transaction[]> => {
  const now = new Date();
  const startTime = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
  
  return inMemoryTransactions
    .filter((t: Transaction) => t.timestamp >= startTime)
    .sort((a: Transaction, b: Transaction) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 20);
};

export const getSummary = async (userId: string, role: 'merchant' | 'customer', period: 'today' | 'week' | 'month' = 'today') => {
  const days = period === 'today' ? 1 : period === 'week' ? 7 : 30;
  const transactions = await getTransactions(userId, role, days);
  const total = transactions.reduce((sum: number, t: Transaction) => sum + (t.status === 'success' ? t.amount : 0), 0);
  return {
    total,
    count: transactions.length,
    period
  };
};

export const verifyPayment = async (userId: string, amount: number, timeWindowMinutes: number = 10): Promise<Transaction[]> => {
  const startTime = new Date(new Date().getTime() - timeWindowMinutes * 60 * 1000).toISOString();
  
  return inMemoryTransactions.filter((t: Transaction) => 
    t.amount === amount && 
    t.timestamp >= startTime && 
    t.status === 'success'
  ).sort((a: Transaction, b: Transaction) => b.timestamp.localeCompare(a.timestamp));
};

export const queryTransactions = async (
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
    searchQuery?: string;
  }
): Promise<Transaction[]> => {
  let result = [...inMemoryTransactions];

  if (filters.searchQuery) {
    const q = filters.searchQuery.toLowerCase();
    result = result.filter((t: Transaction) => 
      t.merchantName?.toLowerCase().includes(q) || 
      t.customerName?.toLowerCase().includes(q)
    );
  }

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

  return result.sort((a: Transaction, b: Transaction) => b.timestamp.localeCompare(a.timestamp));
};

export const categorizeTransaction = async (transactionId: string, category: string) => {
  const txn = inMemoryTransactions.find(t => t.id === transactionId || t.referenceId === transactionId);
  if (txn) {
    txn.category = category;
  }
  return { success: true, message: `Transaction categorized as ${category}` };
};

export const checkDispute = async (userId: string, amount: number, referenceId?: string) => {
  const match = inMemoryTransactions.find(t => 
    t.amount === amount && (!referenceId || t.referenceId === referenceId)
  );
  if (match) {
    return { status: "success", count: 1, message: "Payment verified in settlement records." };
  }
  return { status: "missing", message: "No payment found for this amount." };
};

export const suggestCategory = (merchantName: string): string => {
  const name = merchantName.toLowerCase();
  if (name.includes('swiggy') || name.includes('zomato') || name.includes('restaurant') || name.includes('food')) return 'Food';
  if (name.includes('uber') || name.includes('ola') || name.includes('petrol') || name.includes('fuel')) return 'Travel';
  if (name.includes('amazon') || name.includes('flipkart') || name.includes('myntra') || name.includes('mall')) return 'Shopping';
  if (name.includes('jio') || name.includes('airtel') || name.includes('recharge') || name.includes('bill')) return 'Bills';
  if (name.includes('hospital') || name.includes('pharmacy') || name.includes('medical')) return 'Health';
  return 'General';
};

export const tools = [
  {
    functionDeclarations: [
      {
        name: "getTransactions",
        description: "Get recent transactions for the user.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            days: { type: Type.NUMBER, description: "Number of days to look back (default 1)" }
          }
        }
      },
      {
        name: "getSummary",
        description: "Get total spent/received summary for a period.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            period: { type: Type.STRING, description: "Period: today, week, or month" }
          }
        }
      },
      {
        name: "verifyPayment",
        description: "Verify if a payment of a specific amount was received recently.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER, description: "Payment amount to check" },
            timeWindowMinutes: { type: Type.NUMBER, description: "Time window in minutes (default 10)" }
          },
          required: ["amount"]
        }
      }
    ]
  }
];

export async function askGemini(prompt: string, context?: any) {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `You are Vaani, an intelligent AI Finance Controller. Answer the user prompt accurately based on financial facts.\nContext: ${JSON.stringify(context || {})}\nPrompt: ${prompt}`
            }
          ]
        }
      ]
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I am currently unable to connect to Gemini Live AI. Please verify your VITE_GEMINI_API_KEY.";
  }
}

import { GoogleGenAI, Modality, LiveServerMessage, Type } from "@google/genai";
import { collection, query, where, getDocs, orderBy, limit, Timestamp, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Transaction } from "../types";
import { mockTransactions, kiranaInventory } from "../mockData";
import { syntheticFinancialRecords, syntheticSettlementBatches } from "../data/financialDataset";
import { runDeterministicReconciliation } from "../reconciliation/reconciliationEngine";

const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
  if (!apiKey) {
    console.warn("Gemini API Key is missing! Please set VITE_GEMINI_API_KEY in your environment.");
  }
  return new GoogleGenAI({ apiKey });
};

export const getTransactions = async (userId: string, role: 'merchant' | 'customer', days: number = 1): Promise<Transaction[]> => {
  const now = new Date();
  const startTime = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
  
  return mockTransactions.filter((t: Transaction) => t.timestamp >= startTime).sort((a: Transaction, b: Transaction) => b.timestamp.localeCompare(a.timestamp)).slice(0, 20);
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
  
  return mockTransactions.filter((t: Transaction) => 
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
  let result = [...mockTransactions];

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
  const transactionRef = doc(db, "transactions", transactionId);
  await updateDoc(transactionRef, { category });
  return { success: true, message: `Transaction categorized as ${category}` };
};

export const checkDispute = async (userId: string, amount: number, referenceId?: string) => {
  const transactionsRef = collection(db, "transactions");
  
  let q = query(
    transactionsRef,
    where("merchantId", "==", userId),
    where("amount", "==", amount),
    where("status", "==", "success")
  );
  
  if (referenceId) {
    q = query(q, where("referenceId", "==", referenceId));
  }
  
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) {
    const failedQ = query(
      transactionsRef,
      where("merchantId", "==", userId),
      where("amount", "==", amount),
      where("status", "==", "failed")
    );
    const failedSnapshot = await getDocs(failedQ);
    if (!failedSnapshot.empty) {
      return { status: "failed", count: failedSnapshot.size, message: "Found failed payments for this amount." };
    }
    return { status: "missing", message: "No payment found for this amount." };
  }
  
  return { status: "success", count: querySnapshot.size, message: "Payment verified successfully." };
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
        description: "Get a summary of total earnings or spending for a specific period.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            period: { type: Type.STRING, enum: ["today", "week", "month"], description: "The period for the summary" }
          }
        }
      },
      {
        name: "verifyPayment",
        description: "Verify if a specific amount was received recently.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER, description: "The amount to verify" },
            timeWindowMinutes: { type: Type.NUMBER, description: "Minutes to look back (default 10)" }
          },
          required: ["amount"]
        }
      }
    ]
  }
];

export const createLiveSession = (userId: string, role: 'merchant' | 'customer', callbacks: any) => {
  console.log("Connecting to Vaani AI Finance Controller Live Session...");

  const fetchWithRetry = async (url: string, options?: RequestInit, retries = 2, delay = 1000): Promise<Response> => {
    try {
      const response = await fetch(url, options);
      if (!response.ok && retries > 0) throw new Error(`HTTP ${response.status}`);
      return response;
    } catch (err) {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithRetry(url, options, retries - 1, delay * 2);
      }
      throw err;
    }
  };

  const healthUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/health` : 'http://localhost:3000/api/health';
  fetchWithRetry(healthUrl)
    .then(r => r.json())
    .then(d => console.log("Backend Status:", d.status))
    .catch(err => console.error("Backend Health Check Error:", err));

  const connectWithRetry = async (retries = 2, delay = 1000): Promise<any> => {
    try {
      const now = new Date();
      const currentDate = now.toLocaleDateString('en-IN', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Kolkata' 
      });
      const currentTime = now.toLocaleTimeString('en-IN', { 
        hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' 
      });

      // Run live deterministic reconciliation to get ground truth metrics
      const recon = runDeterministicReconciliation(syntheticFinancialRecords);
      const metrics = recon.metrics;
      const exceptions = recon.exceptions;

      const exceptionSummaries = exceptions.map(e => 
        `- [${e.exceptionCode}] ${e.type} (Txn: ${e.transactionId}, Expected: ₹${e.expectedAmount}, Actual: ₹${e.actualAmount}, Diff: ₹${e.difference}): ${e.aiExplanation}`
      ).join('\n');

      const financePrompt = `
You are Vaani, the voice-native AI Finance Controller & Virtual CFO for modern Indian merchants.
You empower merchants to reconcile payments, detect settlement discrepancies, explain financial exceptions, and control cash flow with zero hallucination.

[LIVE FINANCIAL CONTEXT - VERIFIED DETERMINISTIC TRUTH]
Today's Date: ${currentDate}
Current Time: ${currentTime}
Total Records Processed: ${metrics.totalRecordsProcessed}
Successfully Matched Records: ${metrics.matchedCount}
Pending / Partial Records: ${metrics.partialCount}
Unresolved Exceptions: ${metrics.exceptionsCount}
Reconciliation Match Rate: ${metrics.matchRatePercentage}%
Total Gross Volume Processed: ₹${metrics.totalGrossProcessed.toLocaleString('en-IN')}
Total Reconciled Amount: ₹${metrics.totalReconciledAmount.toLocaleString('en-IN')}
Total Exception Amount: ₹${metrics.totalExceptionAmount.toLocaleString('en-IN')}
Total Gateway Fees & GST Deducted: ₹${metrics.totalFeesPaid.toLocaleString('en-IN')}

[CURRENT CASH POSITION & LIQUIDITY]
Available Cash: ₹2,46,500
Pending Gateway Settlements Inflow (T+1): ₹58,820
Refund Obligations Buffer: ₹12,500
Projected 7-Day Net Cash Position: ₹3,18,200

[ACTIVE FINANCIAL EXCEPTIONS LIST - VERIFIED EVIDENCE]:
${exceptionSummaries}

[CRITICAL INSTRUCTIONS FOR VAANI]
1. ACCURACY & ZERO HALLUCINATION:
- Whenever asked about balances, match rates, differences, or exceptions, ALWAYS use the verified deterministic values above.
- NEVER invent financial figures.
- Example: If asked "₹400 ka difference kahan se aaya?", reply: "Rajesh Nair ke transaction TXN_98217345 par gateway ne ₹400 ka chargeback deduction kiya hai."
- If asked "Kitne exceptions open hain?", reply: "Aapke 4 financial exceptions open hain, jisme total ₹27,488 ki variance hai."
- If asked "Match rate kitna hai?", reply: "Aapka automated match rate 92.3% hai, jisme 48 records match ho chuke hain."
- If asked "Aaj ka settlement kitna hai?", reply: "Aaj ka expected settlement ₹57,431.85 hai jo T+1 cycle me pipeline me hai."
- If asked "Cash position kya hai?", reply: "Aapka available cash ₹2.46 lakh hai aur projected 7-day position ₹3.18 lakh hai."

2. NATURAL HINGLISH VOICE CONVERSATION:
- Speak in warm, concise, professional Hinglish (Hindi + English).
- Keep answers ultra-concise (1 to 2 sentences max) so voice playback is fast and responsive.
- Always sound like a high-calibre financial controller.
      `;

      const ai = getAI();
      return await ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-12-2025", 
        callbacks,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: financePrompt,
          outputAudioTranscription: {},
          inputAudioTranscription: {}
        },
      });
    } catch (err) {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
        return connectWithRetry(retries - 1, delay * 2);
      }
      throw err;
    }
  };

  return connectWithRetry();
};

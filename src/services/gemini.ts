import { GoogleGenAI, Modality, LiveServerMessage, Type } from "@google/genai";
import { collection, query, where, getDocs, orderBy, limit, Timestamp, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Transaction } from "../types";
import { mockTransactions, kiranaInventory } from "../mockData";

const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
  if (!apiKey) {
    console.error("Gemini API Key is missing! Please set GEMINI_API_KEY in your environment.");
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
  ).sort((a: Transaction,b: Transaction) => b.timestamp.localeCompare(a.timestamp));
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

  return result.sort((a: Transaction,b: Transaction) => b.timestamp.localeCompare(a.timestamp));
};

export const categorizeTransaction = async (transactionId: string, category: string) => {
  const transactionRef = doc(db, "transactions", transactionId);
  await updateDoc(transactionRef, { category });
  return { success: true, message: `Transaction categorized as ${category}` };
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

export const getTopCategory = async (userId: string, role: 'merchant' | 'customer', period: 'today' | 'week' | 'month' = 'month') => {
  const days = period === 'today' ? 1 : period === 'week' ? 7 : 30;
  const transactions = await getTransactions(userId, role, days);
  
  if (transactions.length === 0) return { message: "No transactions found for this period." };
  
  const categoryTotals: Record<string, number> = {};
  transactions.forEach(t => {
    if (t.status === 'success') {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    }
  });
  
  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
  
  if (!topCategory) return { message: "No successful transactions found." };
  
  return {
    category: topCategory[0],
    amount: topCategory[1],
    period
  };
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
    // Check for failed payments
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

export const tools = [
  {
    functionDeclarations: [
      {
        name: "getTransactions",
        description: "Get recent transactions for the user. Use this to answer queries about recent payments, last transaction, etc.",
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
        description: "Verify if a specific amount was received recently. Use this for queries like '₹500 aaya kya?'",
        parameters: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER, description: "The amount to verify" },
            timeWindowMinutes: { type: Type.NUMBER, description: "Minutes to look back (default 10)" }
          },
          required: ["amount"]
        }
      },
      {
        name: "queryTransactions",
        description: "Advanced filtering for transactions. Use this for queries like 'Show me all food expenses', 'Did I pay Shreed?', 'find transactions for Nitesh or Zomato', etc.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING, description: "Category of expense (food, travel, etc.)" },
            minAmount: { type: Type.NUMBER, description: "Minimum amount" },
            maxAmount: { type: Type.NUMBER, description: "Maximum amount" },
            days: { type: Type.NUMBER, description: "Number of days to look back" },
            startDate: { type: Type.STRING, description: "Start date in ISO format" },
            endDate: { type: Type.STRING, description: "End date in ISO format" },
            status: { type: Type.STRING, enum: ["success", "failed", "pending"], description: "Transaction status" },
            referenceId: { type: Type.STRING, description: "Reference ID of the transaction" },
            searchQuery: { type: Type.STRING, description: "Name of the person or merchant to search for (e.g. 'Shreed', 'Nitesh', 'Zomato')." }
          }
        }
      },
      {
        name: "categorizeTransaction",
        description: "Manually categorize a transaction.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            transactionId: { type: Type.STRING, description: "The ID of the transaction" },
            category: { type: Type.STRING, description: "The new category" }
          },
          required: ["transactionId", "category"]
        }
      },
      {
        name: "checkDispute",
        description: "Check if a specific payment was received or is missing. Use this for queries like 'Is ₹500 ka payment hua ya nahi?'",
        parameters: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER, description: "The amount to check" },
            referenceId: { type: Type.STRING, description: "Optional reference ID" }
          },
          required: ["amount"]
        }
      },
      {
        name: "generateReport",
        description: "Generate a daily report of transactions. Use this when the merchant says 'Aaj ka report bhej do'.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            period: { type: Type.STRING, enum: ["today", "yesterday"], description: "The period for the report" }
          }
        }
      },
      {
        name: "getTopCategory",
        description: "Identify the category with the highest spending or most transactions.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            period: { type: Type.STRING, enum: ["today", "week", "month"], description: "The period to analyze" }
          }
        }
      }
    ]
  }
];

export const createLiveSession = (userId: string, role: 'merchant' | 'customer', callbacks: any) => {
  console.log("Connecting to Vaani Live Session via Backend...");
  console.log("UserId:", userId, "Role:", role);
  
  // Helper for retrying fetch calls
  const fetchWithRetry = async (url: string, options?: RequestInit, retries = 3, delay = 1000): Promise<Response> => {
    try {
      const response = await fetch(url, options);
      if (!response.ok && retries > 0) throw new Error(`HTTP ${response.status}`);
      return response;
    } catch (err) {
      if (retries > 0) {
        console.warn(`Fetch failed for ${url}, retrying in ${delay}ms... (${retries} left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithRetry(url, options, retries - 1, delay * 2);
      }
      throw err;
    }
  };

  // Verify backend health with retry
  const healthUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/health` : 'http://localhost:3000/api/health';
  fetchWithRetry(healthUrl)
    .then(r => r.json())
    .then(d => console.log("Backend Status:", d.status))
    .catch(err => console.error("Backend Health Check Failed after retries:", err));

  // Retry mechanism for transient network issues
  const connectWithRetry = async (retries = 3, delay = 1000): Promise<any> => {
    try {
      const now = new Date();
      const currentDate = now.toLocaleDateString('en-IN', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Kolkata' 
      });
      const currentTime = now.toLocaleTimeString('en-IN', { 
        hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' 
      });

      // INJECT REAL-TIME DATA DIRECTLY INTO PROMPT TO ELIMINATE TOOL LAG
      // Calculate exactly as Dashboard.tsx to match values perfectly
      let totalBalance = 245000;
      let totalReceived = 0;
      let totalSpent = 0;
      const categorySpends: Record<string, number> = {};
      const merchantSpends: Record<string, { count: number; total: number }> = {};

      mockTransactions.forEach((t) => {
        if (t.status === "failed") return;
        const amount = Number(t.amount);
        if (t.type === "Received" || t.type === "Cashback") {
          totalReceived += amount;
        } else {
          totalSpent += amount;
          const cat = t.category || "Other";
          categorySpends[cat] = (categorySpends[cat] || 0) + amount;
          const merch = t.merchantName || "Unknown";
          if (!merchantSpends[merch]) merchantSpends[merch] = { count: 0, total: 0 };
          merchantSpends[merch].count += 1;
          merchantSpends[merch].total += amount;
        }
      });
      const netBalance = totalBalance + totalReceived - totalSpent;

      const recentTxs = mockTransactions.slice(0, 50).map(t => {
        const party = t.merchantName && t.merchantName !== 'User' ? t.merchantName : (t.customerName || 'Unknown');
        const timeStr = new Date(t.timestamp).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' });
        const itemsStr = t.items && t.items.length > 0 ? ` [Items: ${t.items.map((i: any) => `${i.name} x${i.qty}`).join(', ')}]` : '';
        return `- ${t.type === 'Received' ? 'Received from' : 'Paid to'} ${party}, Amount: ₹${t.amount}, Status: ${t.status}, Category: ${t.category || 'None'}, Time: ${timeStr}${itemsStr}`;
      }).join('\\n    ');
      
      const spendingSnapshotStr = Object.entries(categorySpends).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([cat, amt]) => `${cat}: ₹${amt}`).join(', ');
      const topMerchantsStr = Object.entries(merchantSpends).sort((a, b) => b[1].total - a[1].total).slice(0, 3).map(([merch, data]) => `${merch} (₹${data.total}, ${data.count} txns)`).join(', ');

      const inventoryStr = kiranaInventory.map((item: any) => `- ${item.name} | Price: ₹${item.price} | Stock: ${item.stock} ${item.unit} | Status: ${item.status}`).join('\n    ');

      const merchantPrompt = `
    You are Vaani, a highly conversational, ultra-fast, and friendly AI Voice Assistant & Virtual CFO for Indian merchants.
    You help the merchant manage their business, analyze their inventory, summarize profits/losses, and give strategic CFO-level business advice based on their data.
    Your absolute priority is to be warm, human-like, and very engaging. NEVER sound like a robotic system.
    You speak naturally in casual Hinglish (Hindi + English), just like a real person talking on a phone call.
    
    [CURRENT CONTEXT - MEMORIZE THIS!]
    Today's Date: ${currentDate}
    Current Time: ${currentTime}
    Total Balance (Available to spend): ₹${netBalance}
    Total Received (Incoming): ₹${totalReceived}
    Monthly Spends (Outgoing): ₹${totalSpent}
    Spending Snapshot (Categories): ${spendingSnapshotStr}
    Top Merchants: ${topMerchantsStr}
    
    [INVENTORY DATA - ACT AS INVENTORY MANAGER & CFO]:
    ${inventoryStr}
    (Analyze this inventory data if user asks what to restock, what is low on stock, which items sell most, or what inventory was sold after a payment.)

    [YOUR DASHBOARD DATA - YOU ALREADY HAVE ALL THE DATA. NEVER USE TOOLS]:
    ${recentTxs}
    (If the user asks about recent transactions, balances, or what items customers bought, ALWAYS look at the data above and answer INSTANTLY. YOU DO NOT NEED ANY TOOLS!).
    NOTE: Check the "Items: [...]" in the transaction list above to know what inventory was sold!

    1. BUSINESS ANALYSIS & CFO CAPABILITIES (CRITICAL):
    - You must smartly cross-reference inventory with received transactions to tell the merchant what is selling and what needs restocking.
    - If the user asks "stock kaisa hai" or "kya order karna chahiye", suggest items with "Low Stock" or "Out of Stock" from the inventory list above.
    - If the user asks "kal ke 2k payment ke baad inventry me kya kam ho gya" or similar, LOOK at the transactions above that match the amount/date, check the "Items: " array in that transaction, and state those items! This is critical for answering inventory queries linked to payments.
    - You can give deep insights in a friendly way (e.g., "Aapka Maggi bahut bik raha hai aur stock kam hai, main restock list me dal deti hu.")

    2. HINGLISH COMPREHENSION & INTENT RECOGNITION (CRITICAL):
    - Users will speak in very informal Hinglish. They might mispronounce names or use casual slang.
    - BE EXTREMELY SMART AT GUESSING INTENT. Even if words are broken, understand what they mean.
    - Examples of what users mean:
      "paisa aaya kya?" -> Check the list above for recent 'Received'.
      "stock me kya kam hai / inventry kaisa hai" -> Check the INVENTORY DATA for "Low Stock" or "Out of Stock", and check recent sales.

    3. CONVERSATIONAL RULES:
    - ALWAYS reply in Hinglish. Never use pure, complex English or pure, formal Hindi.
    - If the user says "Hi", "Hello", "Kaise ho", reply warmly FIRST (e.g. "Main theek hu, batayiye kya help karu?").
    - Use natural conversational fillers like "Ji", "Zaroor", "Dekhti hu", "Haan bilkul", "Arey wah".

    4. SPEED & CONCISENESS RULES (CRITICAL FOR LATENCY - DO NOT VIOLATE):
    - Keep your answers EXTREMELY SHORT (1 sentence max) and to the point.
    - NEVER read out Reference IDs or long boring lists. Summarize instead.
    - Good Example: "Aapka Amul Butter out of stock hai, aur Dabur Honey low stock hai. Maine list me dal diya hai."
    - DO NOT generate slow thinking words ("umm", "lagta hai let me check"). Give the answer instantly.
    - DO NOT use tools. You already have all the dashboard data in the list above. Read from it and speak immediately.
  `;

      const customerPrompt = `
    You are Vaani, a highly conversational, ultra-fast, and friendly Personal Finance Assistant.
    Your absolute priority is to be warm, human-like, and very engaging. NEVER sound like a robotic system.
    You speak naturally in casual Hinglish (Hindi + English), just like a real person talking to a friend on a phone call.

    [CURRENT CONTEXT - MEMORIZE THIS!]
    Today's Date: ${currentDate}
    Current Time: ${currentTime}
    Total Balance (Available to spend): ₹${netBalance}
    Total Received (Incoming): ₹${totalReceived}
    Monthly Spends (Outgoing): ₹${totalSpent}
    Spending Snapshot (Categories): ${spendingSnapshotStr}
    Top Merchants: ${topMerchantsStr}

    [YOUR DASHBOARD DATA - YOU ALREADY HAVE ALL THE DATA. NEVER USE TOOLS]:
    ${recentTxs}
    (If the user asks about recent transactions, simply look at the data above and answer INSTANTLY. YOU DO NOT NEED ANY TOOLS!).

    1. HINGLISH COMPREHENSION & INTENT RECOGNITION (CRITICAL):
    - Users will speak in very informal Hinglish. They might mispronounce names or use casual slang.
    - BE EXTREMELY SMART AT GUESSING INTENT. Even if words are broken, understand what they mean.
    - Examples of what users mean:
      "zomato pe kitna kharcha hua" -> Check list above for "Zomato".
      "last week kitne paise udaye" -> Get summary for the week using Total Outgoing data above.
      "shreed ko paise gaye kya" -> Check list above for "Shreed".

    2. CONVERSATIONAL RULES:
    - ALWAYS reply in Hinglish. Never use pure, complex English.
    - If the user says "Hi", "Hello", "Kaise ho", reply warmly FIRST.
    - Act like a helpful friend. Say "Arey wah", "Thoda dhyan rakhiye", "Paisa bacha lijiye mujse".
    
    3. SPEED & CONCISENESS RULES (CRITICAL FOR LATENCY - DO NOT VIOLATE):
    - Keep your answers EXTREMELY SHORT and to the point. Give the answer instantly.
    - NEVER read out Reference IDs. Keep summaries brief.
    - Good Example: "Aapne Zomato par kal ₹450 kharch kiye the."
    - DO NOT use tools. You already have all the dashboard data in the list above. Read from it and speak immediately.
  `;

      const systemInstruction = role === 'merchant' ? merchantPrompt : customerPrompt;

      // Create a new GoogleGenAI instance right before making an API call to ensure it always uses the most up-to-date API key
      const ai = getAI();
      return await ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-12-2025", 
        callbacks,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction,
          // tools, // DISABLED TO FORCE INSTANT CONTEXT REPLIES
          outputAudioTranscription: {},
          inputAudioTranscription: {}
        },
      });
    } catch (err) {
      if (retries > 0) {
        console.warn(`Connection failed, retrying in ${delay}ms... (${retries} left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return connectWithRetry(retries - 1, delay * 2);
      }
      throw err;
    }
  };

  return connectWithRetry();
};
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 

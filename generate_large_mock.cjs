const fs = require('fs');

const names = ["Shreed", "Nitesh", "Vivek", "Rahul Sharma", "Priya Singh", "Amit Kumar", "Vikram Patel", "Pooja", "Arun", "Sneha", "Rohan", "Anjali"];
const merchants = ["Zomato", "Jio Pre-Paid", "Amazon India", "Paytm Cashback", "MakeMyTrip", "BookMyShow", "D-Mart", "Uber", "LIC Premium", "Swiggy", "Paytm Gold", "Flipkart", "Nykaa", "Oyo", "IRCTC", "Starbucks", "Reliance Fresh"];
const categories = ["Food & Grocery", "Transfer", "Recharges & Bill Payments", "Shopping", "Cashback", "Travel", "Movies & Events", "Insurance", "Paytm Gold"];
const methods = ["UPI", "Credit Card", "Wallet", "Debit Card", "Net Banking"];

function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function daysAgo(days) {
    const d = new Date();
    d.setTime(d.getTime() - days * 24 * 60 * 60 * 1000);
    return d.toISOString();
}

let transactions = [];
let idCounter = 1;

// Seed the base 15 to keep consistency with previous snapshot
const baseTransactions = [
  { id: "t" + (idCounter++), amount: 450, currency: "INR", timestamp: daysAgo(0.1), merchantId: "M_ZOMATO", customerId: "u1", customerName: "User", merchantName: "Zomato", category: "Food & Grocery", status: "success", type: "Paid", referenceId: "TXN_ZOM_1", payment_method: "UPI" },
  { id: "t" + (idCounter++), amount: 15000, currency: "INR", timestamp: daysAgo(0.5), merchantId: "M_RAHUL", customerId: "u1", customerName: "User", merchantName: "Rahul Sharma", category: "Transfer", status: "success", type: "Received", referenceId: "TXN_RCV_1", payment_method: "UPI" },
  { id: "t" + (idCounter++), amount: 1250, currency: "INR", timestamp: daysAgo(1), merchantId: "M_JIO", customerId: "u1", customerName: "User", merchantName: "Jio Pre-Paid", category: "Recharges & Bill Payments", status: "success", type: "Paid", referenceId: "TXN_JIO_1", payment_method: "Credit Card" },
  { id: "t" + (idCounter++), amount: 699, currency: "INR", timestamp: daysAgo(1.5), merchantId: "M_AMAZON", customerId: "u1", customerName: "User", merchantName: "Amazon India", category: "Shopping", status: "success", type: "Paid", referenceId: "TXN_AMZN_1", payment_method: "Credit Card" },
  { id: "t" + (idCounter++), amount: 50, currency: "INR", timestamp: daysAgo(2), merchantId: "M_PAYTM", customerId: "u1", customerName: "User", merchantName: "Paytm Cashback", category: "Cashback", status: "success", type: "Cashback", referenceId: "TXN_CB_1", payment_method: "Wallet" },
  { id: "t" + (idCounter++), amount: 4500, currency: "INR", timestamp: daysAgo(3), merchantId: "M_MAKEMYTRIP", customerId: "u1", customerName: "User", merchantName: "MakeMyTrip", category: "Travel", status: "failed", type: "Paid", referenceId: "TXN_MMT_1", payment_method: "UPI", failure_reason: "Bank Server Down" },
  { id: "t" + (idCounter++), amount: 800, currency: "INR", timestamp: daysAgo(4), merchantId: "M_BOOKMYSHOW", customerId: "u1", customerName: "User", merchantName: "BookMyShow", category: "Movies & Events", status: "success", type: "Paid", referenceId: "TXN_BMS_1", payment_method: "UPI" },
  { id: "t" + (idCounter++), amount: 2400, currency: "INR", timestamp: daysAgo(5), merchantId: "M_DMART", customerId: "u1", customerName: "User", merchantName: "D-Mart", category: "Food & Grocery", status: "success", type: "Paid", referenceId: "TXN_DMT_1", payment_method: "Credit Card" },
  { id: "t" + (idCounter++), amount: 3000, currency: "INR", timestamp: daysAgo(6), merchantId: "M_PRIYA", customerId: "u1", customerName: "User", merchantName: "Priya Singh", category: "Transfer", status: "success", type: "Received", referenceId: "TXN_RCV_2", payment_method: "UPI" }
];

transactions.push(...baseTransactions);

// Now generate the rest to make it over 60
for (let i = 0; i < 55; i++) {
    const isPerson = Math.random() > 0.5;
    const isReceive = isPerson && Math.random() > 0.4;
    
    let mName = isPerson ? randomChoice(names) : randomChoice(merchants);
    let cat = isPerson ? "Transfer" : randomChoice(categories.filter(c => c !== "Transfer"));
    
    transactions.push({
        id: "t" + (idCounter++),
        amount: Math.floor(Math.random() * 5000) + 50,
        currency: "INR",
        timestamp: daysAgo(Math.random() * 30),
        merchantId: "M_" + mName.toUpperCase().replace(/\s/g, ''),
        customerId: "u1",
        customerName: "User",
        merchantName: mName,
        category: cat,
        status: Math.random() > 0.9 ? "failed" : "success",
        type: cat === "Cashback" ? "Cashback" : (isReceive ? "Received" : "Paid"),
        referenceId: "TXN_GEN_" + idCounter,
        payment_method: randomChoice(methods)
    });
}

// Ensure the specific names user requested
transactions.push({ id: "t" + (idCounter++), amount: 1500, currency: "INR", timestamp: daysAgo(0.2), merchantId: "M_SHREED", customerId: "u1", customerName: "User", merchantName: "Shreed", category: "Transfer", status: "success", type: "Paid", referenceId: "TXN_SHREED_1", payment_method: "UPI" });
transactions.push({ id: "t" + (idCounter++), amount: 8000, currency: "INR", timestamp: daysAgo(1.2), merchantId: "M_NITESH", customerId: "u1", customerName: "User", merchantName: "Nitesh", category: "Transfer", status: "success", type: "Received", referenceId: "TXN_NITESH_1", payment_method: "UPI" });
transactions.push({ id: "t" + (idCounter++), amount: 250, currency: "INR", timestamp: daysAgo(2.5), merchantId: "M_VIVEK", customerId: "u1", customerName: "User", merchantName: "Vivek", category: "Transfer", status: "success", type: "Paid", referenceId: "TXN_VIVEK_1", payment_method: "UPI" });

// Sort by timestamp desc before saving to be neat
transactions.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

const fileContent = `import { Transaction } from "./types";

export const mockTransactions: Transaction[] = ${JSON.stringify(transactions, null, 2)};
`;

fs.writeFileSync('src/mockData.ts', fileContent);
console.log("Written " + transactions.length + " transactions to src/mockData.ts");
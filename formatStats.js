import fs from 'fs';
import { mockTransactions } from './src/mockData.js';

let totalBalance = 245000;
let totalReceived = 0;
let totalSpent = 0;
const categorySpends = {};
const merchantSpends = {};

mockTransactions.forEach(t => {
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

console.log("netBalance", netBalance);
console.log("totalSpent", totalSpent);
console.log("totalReceived", totalReceived);

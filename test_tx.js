import { mockTransactions } from "./src/mockData.js";
console.log(mockTransactions.slice(0, 5).map(t => t.timestamp));

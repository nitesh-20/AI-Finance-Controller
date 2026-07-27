const fs = require('fs');

const categories = [
  "Food & Grocery", 
  "Shopping", 
  "Recharges & Bill Payments", 
  "Travel", 
  "Movies & Events", 
  "Insurance", 
  "Transfer"
];

const grocerNames = [
  "Vaani Kirana Store",
  "Gupta Provisions",
  "Sharma General Store",
  "Fresh Mart",
  "BigBasket Mini",
  "Reliance Smart"
];

const shoppingNames = [
  "Myntra", "Amazon", "Flipkart", "Zara", "H&M", "Shoppers Stop"
];

const travelNames = [
  "MakeMyTrip", "Uber", "Ola", "IRCTC", "RedBus", "IndiGo"
];

const rechargeNames = [
  "Jio Prepaid", "Airtel Postpaid", "BSNL Fiber", "Tata Play", "Dish TV"
];

const foodNames = [
  "Zomato", "Swiggy", "Domino's", "McDonald's", "Haldiram's", "KFC"
];

const eventNames = [
  "BookMyShow", "Paytm Insider", "PVR Cinemas", "INOX"
];

const insuranceNames = [
  "LIC Premium", "HDFC Ergo", "ICICI Lombard", "Star Health"
];

const transferNames = [
  "Rahul", "Amit", "Priya", "Anjali", "Suresh", "Vikash", "Anandi", "Neha"
];

const inventoryItemsPool = [
  { name: "Aashirvaad Atta 5kg", price: 250 },
  { name: "Saffola Gold Oil 1L", price: 180 },
  { name: "Tata Salt 1kg", price: 25 },
  { name: "Maggi 4-Pack", price: 56 },
  { name: "Surf Excel 1kg", price: 120 },
  { name: "Dabur Honey 500g", price: 150 },
  { name: "Amul Butter 500g", price: 250 },
  { name: "Brooke Bond Red Label", price: 130 },
  { name: "Axe Deodorant", price: 199 }
];

const generateTransactions = (count) => {
  const result = [];
  const now = Date.now();
  
  for (let i = 0; i < count; i++) {
    const timestamp = now - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000);
    const category = categories[Math.floor(Math.random() * categories.length)];
    const isKirana = category === "Food & Grocery" && Math.random() > 0.3;
    
    let merchantName, type, amount, status, items;
    status = Math.random() > 0.1 ? "success" : "failed";
    
    if (category === "Transfer") {
      merchantName = transferNames[Math.floor(Math.random() * transferNames.length)];
      type = Math.random() > 0.5 ? "Sent" : "Received";
      amount = Math.floor(Math.random() * 5000) + 100;
    } else {
      type = "Paid";
      if (isKirana) {
         merchantName = grocerNames[Math.floor(Math.random() * grocerNames.length)];
         const numItems = Math.floor(Math.random() * 3) + 1;
         items = [];
         amount = 0;
         for (let j = 0; j < numItems; j++) {
            const itemDef = inventoryItemsPool[Math.floor(Math.random() * inventoryItemsPool.length)];
            const qty = Math.floor(Math.random() * 2) + 1;
            amount += itemDef.price * qty;
            items.push({
               id: `item_${Math.floor(Math.random()*10000)}`,
               name: itemDef.name,
               qty: qty,
               price: itemDef.price
            });
         }
      } else {
         switch(category) {
           case "Shopping": merchantName = shoppingNames[Math.floor(Math.random() * shoppingNames.length)]; break;
           case "Travel": merchantName = travelNames[Math.floor(Math.random() * travelNames.length)]; break;
           case "Recharges & Bill Payments": merchantName = rechargeNames[Math.floor(Math.random() * rechargeNames.length)]; break;
           case "Food & Grocery": merchantName = foodNames[Math.floor(Math.random() * foodNames.length)]; break;
           case "Movies & Events": merchantName = eventNames[Math.floor(Math.random() * eventNames.length)]; break;
           case "Insurance": merchantName = insuranceNames[Math.floor(Math.random() * insuranceNames.length)]; break;
         }
         amount = Math.floor(Math.random() * 3000) + 50;
         if (Math.random() > 0.5) {
           items = [{
             id: `item_${Math.floor(Math.random()*10000)}`,
             name: `${category} Bill`,
             qty: 1,
             price: amount
           }];
         }
      }
    }

    result.push({
      id: `TXN${Math.floor(Math.random()*100000000).toString().padStart(8, '0')}`,
      type,
      amount,
      merchantName: type === "Paid" ? merchantName : undefined,
      customerName: type !== "Paid" ? merchantName : undefined,
      timestamp,
      status,
      category,
      payment_method: "UPI",
      items
    });
  }
  
  return result.sort((a,b) => b.timestamp - a.timestamp);
};

const txns = generateTransactions(50);
const fileContent = `// Auto-generated detailed demo data using generate_mock.js\nexport const MOCK_TRANSACTIONS = ${JSON.stringify(txns, null, 2)};\n`;

fs.writeFileSync('src/mockData.ts', fileContent);
console.log('src/mockData.ts updated successfully with 50 diverse transactions.');
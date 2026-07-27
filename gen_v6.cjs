const fs = require('fs');

const customerNames = ["Arun", "Rahul Sharma", "Priya", "Anjali", "Suresh", "Vikash", "Anandi", "Neha", "Rohan", "Siddharth", "Pooja"];

const vendorsAndBills = [
  { name: "Myntra", cat: "Shopping" },
  { name: "Amazon", cat: "Shopping" },
  { name: "Flipkart", cat: "Shopping" },
  { name: "Jio Pre-Paid", cat: "Recharges & Bill Payments" },
  { name: "Airtel Postpaid", cat: "Recharges & Bill Payments" },
  { name: "MakeMyTrip", cat: "Travel" },
  { name: "Uber", cat: "Travel" },
  { name: "Zomato", cat: "Food & Grocery" },
  { name: "Swiggy", cat: "Food & Grocery" },
  { name: "LIC Premium", cat: "Insurance" },
  { name: "Reliance Distributor", cat: "Transfer" },
  { name: "Shreed", cat: "Transfer" }
];

const inventoryItemsPool = [
  { id: "1", name: "Aashirvaad Atta 5kg", category: "Staples", price: 250, stock: 45, unit: "kg", status: "In Stock" },
  { id: "2", name: "Fortune Sunlite Oil 1L", category: "Staples", price: 180, stock: 30, unit: "L", status: "In Stock" },
  { id: "3", name: "Tata Salt 1kg", category: "Staples", price: 28, stock: 100, unit: "kg", status: "In Stock" },
  { id: "4", name: "Maggi 2-Minute Noodles", category: "Snacks", price: 14, stock: 150, unit: "pack", status: "In Stock" },
  { id: "5", name: "Surf Excel Matic 1kg", category: "Cleaning", price: 210, stock: 25, unit: "kg", status: "In Stock" },
  { id: "6", name: "Dabur Honey 500g", category: "Staples", price: 150, stock: 4, unit: "jar", status: "Low Stock" },
  { id: "7", name: "Amul Butter 500g", category: "Dairy", price: 250, stock: 0, unit: "pack", status: "Out of Stock" },
  { id: "8", name: "Brooke Bond Red Label", category: "Beverages", price: 130, stock: 8, unit: "pack", status: "Low Stock" },
  { id: "9", name: "Axe Deodorant", category: "Personal Care", price: 199, stock: 12, unit: "bottle", status: "In Stock" }
];

function generateTransactions(count) {
  const result = [];
  const now = Date.now();
  
  for (let i = 0; i < count; i++) {
    const timestamp = now - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000);
    let type = Math.random() > 0.5 ? "Received" : "Paid";
    let amount = 0;
    let items = [];
    let merchantName, customerName, category;
    
    const status = Math.random() > 0.1 ? "success" : "failed";
    const payment_method = Math.random() > 0.5 ? "UPI" : (Math.random() > 0.5 ? "Credit Card" : "Debit Card");

    if (type === "Received") {
       customerName = customerNames[Math.floor(Math.random() * customerNames.length)];
       merchantName = customerName;
       category = "Transfer"; 
       
       const numItems = Math.floor(Math.random() * 5) + 1;
       items = [];
       for (let j=0; j<numItems; j++) {
          const item = inventoryItemsPool[Math.floor(Math.random() * inventoryItemsPool.length)];
          const qty = Math.floor(Math.random() * 3) + 1;
          amount += item.price * qty;
          items.push({ id: item.id, name: item.name, qty: qty, price: item.price });
       }
    } else {
       const bill = vendorsAndBills[Math.floor(Math.random() * vendorsAndBills.length)];
       merchantName = bill.name;
       category = bill.cat;
       amount = Math.floor(Math.random() * 3000) + 100;
       
       if (Math.random() > 0.7) {
          items.push({ id: `B_${Math.floor(Math.random()*1000)}`, name: `${category} Bill`, qty: 1, price: amount });
       }
    }

    result.push({
      id: `TXN${Math.floor(Math.random()*100000000).toString().padStart(8, '0')}`,
      type,
      amount,
      merchantName: merchantName,
      customerName: customerName,
      timestamp,
      status,
      category,
      payment_method,
      items
    });
  }
  
  return result.sort((a,b) => b.timestamp - a.timestamp);
}

const txns = generateTransactions(50);
const fileContent = `export const mockTransactions: any[] = ${JSON.stringify(txns, null, 2)};\n\nexport const kiranaInventory: any[] = ${JSON.stringify(inventoryItemsPool, null, 2)};\n`;

fs.writeFileSync('src/mockData.ts', fileContent);
console.log('Regenerated OK');

const fs = require('fs');

const kiranaInventory = [
  { id: 1, name: 'Aashirvaad Atta (1kg)', category: 'Grocery', price: 65, stock: 45, status: 'In Stock' },
  { id: 2, name: 'Tata Salt (1kg)', category: 'Grocery', price: 28, stock: 120, status: 'In Stock' },
  { id: 3, name: 'India Gate Basmati Rice (1kg)', category: 'Grocery', price: 110, stock: 25, status: 'In Stock' },
  { id: 4, name: 'Toor Dal (Premium) (1kg)', category: 'Grocery', price: 160, stock: 8, status: 'Low Stock' },
  { id: 5, name: 'Maggi Masala Noodles (70g)', category: 'Snacks', price: 14, stock: 150, status: 'In Stock' },
  { id: 6, name: 'Parle-G Gold (100g)', category: 'Snacks', price: 10, stock: 200, status: 'In Stock' },
  { id: 7, name: 'Lays Gluco Biscuit', category: 'Snacks', price: 10, stock: 0, status: 'Out of Stock' },
  { id: 8, name: 'Amul Taaza Milk (500ml)', category: 'Dairy', price: 27, stock: 30, status: 'In Stock' },
  { id: 9, name: 'Mother Dairy Paneer (200g)', category: 'Dairy', price: 85, stock: 12, status: 'Low Stock' },
  { id: 10, name: 'Amul Butter (100g)', category: 'Dairy', price: 56, stock: 40, status: 'In Stock' },
  { id: 11, name: 'Fortune Sunflower Oil (1L)', category: 'Grocery', price: 145, stock: 60, status: 'In Stock' },
  { id: 12, name: 'Saffola Gold Oil (1L)', category: 'Grocery', price: 190, stock: 20, status: 'In Stock' },
  { id: 13, name: 'Everest Coriander Powder (100g)', category: 'Spices', price: 30, stock: 85, status: 'In Stock' },
  { id: 14, name: 'MDH Garam Masala (100g)', category: 'Spices', price: 82, stock: 45, status: 'In Stock' },
  { id: 15, name: 'Catch Turmeric Powder (100g)', category: 'Spices', price: 35, stock: 60, status: 'In Stock' },
  { id: 16, name: 'Red Label Tea (250g)', category: 'Beverages', price: 140, stock: 35, status: 'In Stock' },
  { id: 17, name: 'Taj Mahal Tea (250g)', category: 'Beverages', price: 165, stock: 25, status: 'In Stock' },
  { id: 18, name: 'Nescafe Classic (50g)', category: 'Beverages', price: 170, stock: 18, status: 'Low Stock' },
  { id: 19, name: 'Bru Gold Coffee (50g)', category: 'Beverages', price: 145, stock: 22, status: 'In Stock' },
  { id: 20, name: 'Coca-Cola (750ml)', category: 'Beverages', price: 40, stock: 50, status: 'In Stock' },
  { id: 21, name: 'Thumbs Up (250g)', category: 'Beverages', price: 155, stock: 30, status: 'In Stock' },
  { id: 22, name: 'Haldiram Bhujia (200g)', category: 'Snacks', price: 50, stock: 75, status: 'In Stock' },
  { id: 23, name: 'Kurkure Masala Munch (90g)', category: 'Snacks', price: 20, stock: 100, status: 'In Stock' },
  { id: 24, name: 'Bingo Mad Angles (90g)', category: 'Snacks', price: 20, stock: 80, status: 'In Stock' },
  { id: 25, name: 'Britannia NutriChoice (100g)', category: 'Snacks', price: 30, stock: 65, status: 'In Stock' },
  { id: 26, name: 'Sunfeast Dark Fantasy', category: 'Snacks', price: 40, stock: 40, status: 'In Stock' },
  { id: 27, name: 'Madhur Sugar (1kg)', category: 'Grocery', price: 45, stock: 100, status: 'In Stock' },
  { id: 28, name: 'Patanjali Poha (500g)', category: 'Grocery', price: 40, stock: 50, status: 'In Stock' },
  { id: 29, name: 'Surf Excel Washing Powder (1kg)', category: 'Household', price: 120, stock: 45, status: 'In Stock' },
  { id: 30, name: 'Tide Plus (1kg)', category: 'Household', price: 110, stock: 55, status: 'In Stock' },
  { id: 31, name: 'Vim Bar (200g)', category: 'Household', price: 15, stock: 150, status: 'In Stock' },
  { id: 32, name: 'Exo Dishwash (250g)', category: 'Household', price: 20, stock: 110, status: 'In Stock' },
  { id: 33, name: 'Dettol Soap (75g)', category: 'Personal Care', price: 35, stock: 200, status: 'In Stock' },
  { id: 34, name: 'Lifebuoy Soap (75g)', category: 'Personal Care', price: 30, stock: 180, status: 'In Stock' },
  { id: 35, name: 'Dove Soap (75g)', category: 'Personal Care', price: 45, stock: 90, status: 'In Stock' },
  { id: 36, name: 'Colgate Toothpaste (100g)', category: 'Personal Care', price: 55, stock: 120, status: 'In Stock' },
  { id: 37, name: 'Pepsodent (150g)', category: 'Personal Care', price: 65, stock: 85, status: 'In Stock' },
  { id: 38, name: 'Sunsilk Shampoo (80ml)', category: 'Personal Care', price: 65, stock: 40, status: 'In Stock' },
  { id: 39, name: 'Clinic Plus (100ml)', category: 'Personal Care', price: 50, stock: 60, status: 'In Stock' },
  { id: 40, name: 'Head & Shoulders (80ml)', category: 'Personal Care', price: 70, stock: 35, status: 'In Stock' },
  { id: 41, name: 'Parachute Hair Oil (100ml)', category: 'Personal Care', price: 40, stock: 95, status: 'In Stock' },
  { id: 42, name: 'Navratna Hair Oil (100ml)', category: 'Personal Care', price: 45, stock: 80, status: 'In Stock' },
  { id: 43, name: 'Fair & Lovely Face Wash (100g)', category: 'Personal Care', price: 80, stock: 30, status: 'In Stock' },
  { id: 44, name: 'Patanjali Honey (250g)', category: 'Grocery', price: 95, stock: 25, status: 'In Stock' },
  { id: 45, name: 'Dabur Honey (250g)', category: 'Grocery', price: 110, stock: 20, status: 'In Stock' },
  { id: 46, name: 'Kelloggs Corn Flakes (250g)', category: 'Grocery', price: 105, stock: 40, status: 'In Stock' },
  { id: 47, name: 'Quaker Oats (400g)', category: 'Grocery', price: 125, stock: 30, status: 'In Stock' },
  { id: 48, name: 'Britannia Cake Rusk (65g)', category: 'Snacks', price: 30, stock: 70, status: 'In Stock' },
  { id: 49, name: 'Harpic Disinfectant (200ml)', category: 'Household', price: 45, stock: 50, status: 'In Stock' },
  { id: 50, name: 'Lizol Toilet Cleaner (200ml)', category: 'Household', price: 40, stock: 65, status: 'In Stock' },
];

function getRandomItems(num) {
  const items = [];
  const startIdx = Math.floor(Math.random() * (kiranaInventory.length - num));
  for(let i=0; i<num; i++) {
    const qty = Math.floor(Math.random() * 3) + 1;
    const invItem = kiranaInventory[startIdx + i];
    items.push({
      id: invItem.id,
      name: invItem.name,
      quantity: qty,
      price: invItem.price
    });
  }
  return items;
}

const mockTransactions = [];
const customerNames = ["Rahul Sharma", "Priya Singh", "Amit Kumar", "Sneha Gupta", "Vikram Patel", "Divya Desai", "Neha Reddy"];
const now = new Date().getTime();

for(let i = 1; i <= 40; i++) {
  const numItems = Math.floor(Math.random() * 4) + 1;
  const items = getRandomItems(numItems);
  const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  const daysAgo = Math.floor(Math.random() * 14);
  const hoursAgo = Math.floor(Math.random() * 24);
  const txTime = new Date(now - (daysAgo * 86400000) - (hoursAgo * 3600000)).toISOString();
  
  mockTransactions.push({
    id: `tx_k_00${i}`,
    amount: totalAmount,
    currency: "INR",
    timestamp: txTime,
    merchantId: "M_KIRANA",
    customerId: `u_k_${Math.floor(Math.random()*20)}`,
    customerName: customerNames[Math.floor(Math.random() * customerNames.length)],
    merchantName: "Vaani Kirana Store",
    category: "Groceries",
    status: Math.random() > 0.9 ? "failed" : "success",
    type: "Received",
    referenceId: `TXN_KIRANA_${i*837}`,
    payment_method: Math.random() > 0.5 ? "UPI" : "Cash",
    items: items
  });
}

for(let i = 41; i <= 50; i++) {
  const daysAgo = Math.floor(Math.random() * 14);
  const txTime = new Date(now - (daysAgo * 86400000)).toISOString();
  const amount = (Math.floor(Math.random() * 50) + 10) * 100;
  mockTransactions.push({
    id: `tx_exp_00${i}`,
    amount: amount,
    currency: "INR",
    timestamp: txTime,
    merchantId: "M_DIST",
    customerId: "M_KIRANA",
    customerName: "Vaani Kirana Store",
    merchantName: i % 2 === 0 ? "HUL Distributor" : "ITC Wholesaler",
    category: "Inventory Restock",
    status: "success",
    type: "Paid",
    referenceId: `TXN_DIST_${i*111}`,
    payment_method: "Bank Transfer"
  });
}

mockTransactions[0].status = "failed";
mockTransactions[0].failure_reason = "Server Timeout";

mockTransactions.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

const output = `import { Transaction } from "./types";\n\nexport const kiranaInventory = ${JSON.stringify(kiranaInventory, null, 2)};\n\nexport const mockTransactions: Transaction[] = ${JSON.stringify(mockTransactions, null, 2)};\n`;

fs.writeFileSync('src/mockData.ts', output);
console.log("mockData updated successfully");
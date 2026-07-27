import { collection, writeBatch, doc } from "firebase/firestore";
import { db } from "../firebase";
import { Transaction } from "../types";

export const seedOneMonthData = async (
  userId: string,
  role: "merchant" | "customer",
  userName: string,
) => {
  const batch = writeBatch(db);
  const now = new Date();

  const merchants = [
    "Amazon",
    "Flipkart",
    "IRCTC",
    "Swiggy",
    "Zomato",
    "Paytm",
    "Airtel",
    "Jio",
    "MakeMyTrip",
    "BookMyShow",
  ];
  const categories = [
    "Shopping",
    "Travel",
    "Food",
    "Recharge",
    "Bills",
    "Self Transfer",
  ];
  const paymentMethods = ["UPI", "Wallet", "Card"];
  const locations = [
    "Raipur, India",
    "Mumbai, India",
    "Delhi, India",
    "Bangalore, India",
  ];
  const failureReasons = ["Server timeout", "Bank issue", "Network error"];

  const specialTx: Transaction = {
    amount: 499,
    currency: "INR",
    timestamp: new Date(now.getTime() - 1000 * 60 * 30).toISOString(),
    merchantId: "M_SPECIAL_FAILED",
    customerId: userId,
    customerName: userName,
    merchantName: "IRCTC",
    category: "Travel",
    status: "failed",
    type: "Paid",
    referenceId:
      "TXN_" + Math.random().toString(36).substring(2, 10).toUpperCase(),
    description:
      "Nitesh tried to make a payment but it failed due to server issue",
    payment_method: "UPI",
    failure_reason: "Server timeout",
    location: "Raipur, India",
  };
  const specialRef = doc(collection(db, "transactions"));
  batch.set(specialRef, specialTx);

  for (let i = 0; i < 15; i++) {
    const daysAgo = Math.random() * 30;
    const randomTime = now.getTime() - daysAgo * 24 * 60 * 60 * 1000;
    const timestamp = new Date(randomTime).toISOString();

    let merchant = merchants[Math.floor(Math.random() * merchants.length)];
    let category = categories[Math.floor(Math.random() * categories.length)];
    let payment_method =
      paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
    let location = locations[Math.floor(Math.random() * locations.length)];

    let status: "success" | "failed" | "pending" =
      Math.random() > 0.15 ? "success" : "failed";
    let type: "Paid" | "Received" | "Cashback" | "Self Transfer" = "Paid";

    const r = Math.random();
    if (r < 0.1) {
      type = "Cashback";
      category = "Cashback";
      merchant = "Paytm";
    } else if (r < 0.2) {
      type = "Received";
      category = "Self Transfer";
      merchant = "Abhi";
    } else if (r < 0.3) {
      type = "Self Transfer";
      category = "Self Transfer";
      merchant = "Self";
    }

    const tx: Transaction = {
      amount: Math.floor(Math.random() * 5000) + 10,
      currency: "INR",
      timestamp,
      merchantId: "M_" + merchant.toUpperCase(),
      customerId: userId,
      customerName: userName,
      merchantName: merchant,
      category,
      status,
      type,
      referenceId:
        "TXN_" + Math.random().toString(36).substring(2, 10).toUpperCase(),
      description: `Payment for ${category} at ${merchant}`,
      payment_method,
      location,
    };

    if (status === "failed") {
      tx.failure_reason =
        failureReasons[Math.floor(Math.random() * failureReasons.length)];
    }

    const docRef = doc(collection(db, "transactions"));
    batch.set(docRef, tx);
  }

  await batch.commit();
  console.log("Successfully seeded dynamic demo transactions.");
};
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 

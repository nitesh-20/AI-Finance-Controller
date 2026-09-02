#!/usr/bin/env python3
"""
Synthetic Indian Merchant Dataset Generator
Generates realistic 3-way reconciliation datasets with GSTIN, HSN codes, UTR numbers, and controlled anomaly rates.
"""
import json
import random
import os
from datetime import datetime, timedelta

def generate_synthetic_transactions(count=52, anomaly_pct=0.15, seed=42):
    random.seed(seed)
    
    customers = [
        "Aarav Sharma", "Priya Patel", "Vikram Malhotra", "Ananya Verma",
        "Rohan Gupta", "Sneha Iyer", "Rajesh Nair", "Kavita Deshmukh",
        "Arjun Reddy", "Meera Joshi", "Suresh Kumar", "Deepika Padukone",
        "Kunal Shah", "Ritesh Agarwal", "Falguni Nayar", "Vijay Shekhar"
    ]
    
    payment_methods = ["UPI", "Credit Card", "Debit Card", "NetBanking"]
    
    records = []
    base_time = datetime(2026, 8, 18, 9, 30, 0)
    
    for i in range(1, count + 1):
        txn_id = f"TXN_9821{7340 + i}"
        order_id = f"ORD_2026_{1000 + i}"
        customer = random.choice(customers)
        method = random.choice(payment_methods)
        
        # Standard amounts between INR 450 and INR 45,000
        gross = round(random.uniform(450.0, 35000.0), 2)
        mdr_rate = 0.02
        mdr_fee = round(gross * mdr_rate, 2)
        gst_on_fee = round(mdr_fee * 0.18, 2)
        net_expected = round(gross - mdr_fee - gst_on_fee, 2)
        
        is_anomaly = (random.random() < anomaly_pct)
        settlement_status = "settled"
        actual_settled = net_expected
        actual_fee = mdr_fee
        actual_gst = gst_on_fee
        notes = "Clean settlement match verified."
        
        if is_anomaly:
            anomaly_type = random.choice(["CHARGEBACK_HOLD", "MDR_SURCHARGE", "GST_ROUNDING", "MISSING_SETTLEMENT"])
            if anomaly_type == "CHARGEBACK_HOLD":
                actual_settled = round(net_expected - 400.0, 2)
                notes = "Unitemized chargeback holdback of ₹400.00."
            elif anomaly_type == "MDR_SURCHARGE":
                actual_fee = round(mdr_fee * 1.75, 2)
                actual_gst = round(actual_fee * 0.18, 2)
                actual_settled = round(gross - actual_fee - actual_gst, 2)
                notes = "International Card fee surcharge applied (3.5% effective MDR)."
            elif anomaly_type == "GST_ROUNDING":
                actual_settled = round(net_expected - 0.75, 2)
                notes = "Sub-rupee GST tax rounding variance."
            elif anomaly_type == "MISSING_SETTLEMENT":
                settlement_status = "pending"
                actual_settled = 0.0
                notes = "Merchant capture omitted from bank payout batch."
        
        records.append({
            "id": f"REC_{1000 + i}",
            "transactionId": txn_id,
            "orderId": order_id,
            "settlementId": f"SETTLE_2026_08{18 + (i % 3):02d}_01",
            "timestamp": (base_time + timedelta(hours=i*2)).isoformat() + "Z",
            "customerName": customer,
            "paymentMethod": method,
            "grossAmount": gross,
            "expectedGatewayFee": mdr_fee,
            "expectedGst": gst_on_fee,
            "expectedSettlementAmount": net_expected,
            "actualSettlementAmount": actual_settled,
            "actualGatewayFee": actual_fee,
            "actualGst": actual_gst,
            "status": "success",
            "settlementStatus": settlement_status,
            "notes": notes,
            "arnNumber": f"ARN{random.randint(100000000000, 999999999999)}",
            "utrNumber": f"HDFC2623{random.randint(10000000, 99999999)}"
        })
        
    return records

if __name__ == "__main__":
    data = generate_synthetic_transactions(52, 0.12, 42)
    out_path = os.path.join(os.path.dirname(__file__), "..", "data", "generated_transactions.json")
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w") as f:
        json.dump(data, f, indent=2)
    print(f"Generated {len(data)} synthetic merchant transactions at {out_path}.")

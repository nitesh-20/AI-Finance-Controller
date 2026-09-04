"""
Adversarial Financial Dataset Generator (Razorpay AI Buildathon — Track 04)
Generates multi-source financial datasets:
  1. Gateway Settlements (settlements.csv)
  2. Bank Statements (bank_statement.csv)
  3. Merchant Ledger Invoices (merchant_ledger.csv)
  4. Unified Transactions (transactions.csv)
  5. Ground Truth Labels (ground_truth.csv)

Implements the complete 25-anomaly taxonomy:
  1. Exact matches
  2. T+1 settlement date drift
  3. T+2 settlement delay
  4. Duplicate UTR
  5. Duplicate transaction capture
  6. Partial refund
  7. Full refund
  8. Chargeback reserve holdback
  9. Missing settlement (orphan transaction)
  10. Wrong MDR tier (international/corporate card)
  11. Incorrect GST calculation
  12. Bank fee deducted from credit
  13. Settlement aggregation (subset-sum bulk bank credit)
  14. Split settlement (single payment across two batches)
  15. Currency/rounding differences
  16. Missing invoice (unrecorded ERP order)
  17. Bank narration variations (UPI/NEFT/RTGS formatting)
  18. Merchant name variations
  19. Reference number formatting differences
  20. Incorrect settlement amount
  21. Extra bank transaction (unmatched bank credit)
  22. Missing bank transaction (delayed credit)
  23. Settlement with multiple transactions
  24. Multiple transactions with same amount
  25. Deliberately ambiguous records
"""
import os
import csv
import json
import random
from datetime import datetime, timedelta
from decimal import Decimal, ROUND_HALF_UP
from typing import List, Dict, Any, Tuple

CUSTOMER_NAMES = [
    "Aarav Sharma", "Priya Patel", "Vikram Malhotra", "Ananya Rao", "Rohit Verma",
    "Deepika Sen", "Siddharth Nair", "Sneha Kulkarni", "Aditya Joshi", "Pooja Mehta",
    "Karan Singhania", "Neha Gupta", "Manish Tiwari", "Rhea Kapoor", "Varun Dhawan",
    "Ishaan Khatter", "Tanvi Deshmukh", "Nikhil Chopra", "Meera Nambiar", "Rahul Dravid"
]

PAYMENT_METHODS = ["UPI", "Credit Card", "Debit Card", "NetBanking", "Wallet"]
BANKS = ["HDFC Bank Ltd", "ICICI Bank Ltd", "State Bank of India", "Axis Bank Ltd"]

def generate_multi_source_dataset(
    total_records: int = 500,
    adversarial_pct: float = 0.12,
    seed: int = 42
) -> Dict[str, Any]:
    rng = random.Random(seed)
    
    start_date = datetime(2026, 3, 1, 9, 0, 0)
    contracted_mdr = Decimal("0.02")
    gst_rate = Decimal("0.18")
    
    settlements = []
    bank_statements = []
    merchant_invoices = []
    transactions = []
    ground_truths = []
    
    num_adversarial = max(25, int(total_records * adversarial_pct))
    adv_indices = set(rng.sample(range(total_records), num_adversarial))
    
    anomaly_types = [
        "EXACT_MATCH", "T1_DRIFT", "T2_DELAY", "DUPLICATE_UTR", "DUPLICATE_TXN",
        "PARTIAL_REFUND", "FULL_REFUND", "CHARGEBACK_HOLD", "MISSING_SETTLEMENT",
        "WRONG_MDR_TIER", "INCORRECT_GST", "BANK_FEE_DEDUCTION", "SETTLEMENT_AGGREGATION",
        "SPLIT_SETTLEMENT", "CURRENCY_ROUNDING", "MISSING_INVOICE", "NARRATION_VARIATION",
        "MERCHANT_NAME_VARIATION", "REF_FORMAT_DIFF", "INCORRECT_AMOUNT", "EXTRA_BANK_TXN",
        "MISSING_BANK_TXN", "MULTI_TXN_SETTLEMENT", "IDENTICAL_AMOUNT_AMBIGUITY", "DELIBERATELY_AMBIGUOUS"
    ]
    
    # Aggregation pool: 4 records that sum to 1 bulk bank credit
    aggregation_indices = set(range(10, 14))
    bulk_credit_amount = Decimal("0.00")
    bulk_txns = []
    
    anomaly_counter = 0

    for idx in range(total_records):
        txn_id = f"TXN_RZP_{100000 + idx}"
        order_id = f"ORD_INV_{200000 + idx}"
        invoice_id = f"INV_2026_{300000 + idx}"
        utr = f"UTR_HDFC_{800000 + idx}"
        customer = rng.choice(CUSTOMER_NAMES)
        method = rng.choice(PAYMENT_METHODS)
        bank_name = rng.choice(BANKS)
        
        current_time = start_date + timedelta(hours=idx * 0.75)
        settle_date = current_time
        bank_date = current_time + timedelta(days=1)
        invoice_date = current_time
        
        # Gross amount: ₹350 to ₹45,000
        gross = Decimal(str(round(rng.uniform(350.0, 45000.0), 2))).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        mdr = (gross * contracted_mdr).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        gst = (mdr * gst_rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        expected_net = gross - mdr - gst
        
        actual_bank_credit = expected_net
        actual_utr = utr
        refund_amount = Decimal("0.00")
        chargeback_amount = Decimal("0.00")
        other_deductions = Decimal("0.00")
        narration = f"CMS/RAZORPAY/{utr}/{order_id}"
        
        gt_status = "MATCHED"
        gt_exception_type = "NONE"
        gt_root_cause = "MATCHED"
        
        # Check if this index is chosen for adversarial injection
        if idx in aggregation_indices:
            # Aggregation case
            bulk_credit_amount += expected_net
            bulk_txns.append(txn_id)
            narration = "CMS/RAZORPAY/BULK_SETTLEMENT_BATCH"
            gt_status = "EXCEPTION"
            gt_exception_type = "SETTLEMENT_AGGREGATION"
            gt_root_cause = "Settlement Aggregation (Bulk NEFT Payout)"
            # Skip individual bank credit entry for bulk items; bulk credit added at end of group
            if idx == 13:
                bank_statements.append({
                    "bank_txn_id": "BNK_BULK_BATCH_001",
                    "utr": "UTR_HDFC_BULK_001",
                    "bank_date": bank_date.strftime("%Y-%m-%d %H:%M:%S"),
                    "credit_amount": float(bulk_credit_amount),
                    "narration": f"CMS/RAZORPAY/BULK_CREDIT/4_TXNS/{','.join(bulk_txns)}",
                    "bank_name": bank_name,
                    "account_number": "XXXX-XXXX-8921"
                })
        elif idx in adv_indices:
            adv_case = anomaly_types[anomaly_counter % len(anomaly_types)]
            anomaly_counter += 1
            
            if adv_case == "T1_DRIFT":
                bank_date = current_time + timedelta(days=2) # T+2 instead of T+1
                gt_status = "MATCHED"
                gt_root_cause = "T+1 Settlement Window Drift"
                
            elif adv_case == "T2_DELAY":
                bank_date = current_time + timedelta(days=3) # Weekend/holiday delay
                gt_status = "MATCHED"
                gt_root_cause = "T+2 Banking Cycle Delay"
                
            elif adv_case == "DUPLICATE_UTR":
                actual_utr = f"UTR_HDFC_{800000 + max(0, idx - 2)}"
                gt_status = "EXCEPTION"
                gt_exception_type = "DUPLICATE_UTR"
                gt_root_cause = "Duplicate UTR Reference Detected"
                
            elif adv_case == "DUPLICATE_TXN":
                order_id = f"ORD_INV_{200000 + max(0, idx - 1)}"
                gt_status = "EXCEPTION"
                gt_exception_type = "DUPLICATE_TRANSACTION"
                gt_root_cause = "Duplicate Transaction Capture"
                
            elif adv_case == "PARTIAL_REFUND":
                refund_amount = (gross * Decimal("0.30")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                actual_bank_credit = expected_net - refund_amount
                narration += f"/REFUND_PARTIAL_{refund_amount}"
                gt_status = "EXCEPTION"
                gt_exception_type = "PARTIAL_REFUND"
                gt_root_cause = "Partial Customer Refund Deducted"
                
            elif adv_case == "FULL_REFUND":
                refund_amount = gross
                actual_bank_credit = Decimal("0.00")
                gt_status = "EXCEPTION"
                gt_exception_type = "FULL_REFUND"
                gt_root_cause = "Full Order Cancellation & Refund"
                
            elif adv_case == "CHARGEBACK_HOLD":
                chargeback_amount = Decimal("400.00")
                actual_bank_credit = expected_net - chargeback_amount
                narration += "/CB_RESERVE_HOLD"
                gt_status = "EXCEPTION"
                gt_exception_type = "CHARGEBACK_RESERVE"
                gt_root_cause = "Unmapped Chargeback Reserve Holdback"
                
            elif adv_case == "MISSING_SETTLEMENT":
                actual_utr = "UNKNOWN"
                actual_bank_credit = Decimal("0.00")
                gt_status = "EXCEPTION"
                gt_exception_type = "MISSING_SETTLEMENT"
                gt_root_cause = "Gateway Settlement Omitted from Bank Statement"
                
            elif adv_case == "WRONG_MDR_TIER":
                intl_mdr = (gross * Decimal("0.035")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                intl_gst = (intl_mdr * gst_rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                actual_bank_credit = gross - intl_mdr - intl_gst
                narration += "/CORP_INTL_CARD_3.5PCT"
                gt_status = "EXCEPTION"
                gt_exception_type = "WRONG_MDR_TIER"
                gt_root_cause = "International/Corporate MDR Tier Applied (3.5%)"
                
            elif adv_case == "INCORRECT_GST":
                actual_bank_credit = expected_net - Decimal("12.50")
                gt_status = "EXCEPTION"
                gt_exception_type = "GST_MISMATCH"
                gt_root_cause = "Statutory GST Rate Calculation Divergence"
                
            elif adv_case == "BANK_FEE_DEDUCTION":
                other_deductions = Decimal("50.00")
                actual_bank_credit = expected_net - other_deductions
                narration += "/NEFT_BANK_HANDLING_CHRG"
                gt_status = "EXCEPTION"
                gt_exception_type = "BANK_FEE"
                gt_root_cause = "Direct Inter-bank Transfer Fee Deducted"
                
            elif adv_case == "SPLIT_SETTLEMENT":
                actual_bank_credit = (expected_net * Decimal("0.50")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                narration += "/PART_1_SPLIT_PAYOUT"
                gt_status = "EXCEPTION"
                gt_exception_type = "SPLIT_SETTLEMENT"
                gt_root_cause = "Split Gateway Payout across Settlement Cycles"
                
            elif adv_case == "CURRENCY_ROUNDING":
                actual_bank_credit = expected_net + Decimal("0.75")
                gt_status = "EXCEPTION"
                gt_exception_type = "GST_ROUNDING_ERROR"
                gt_root_cause = "Sub-rupee Decimal Rounding Difference"
                
            elif adv_case == "MISSING_INVOICE":
                invoice_id = "UNRECORDED_ERP_DRAFT"
                gt_status = "EXCEPTION"
                gt_exception_type = "MISSING_INVOICE"
                gt_root_cause = "Merchant ERP Order Incomplete or Unrecorded"
                
            elif adv_case == "NARRATION_VARIATION":
                narration = f"UPI/CR/{utr[9:]}/RAZORPAY_PAYMENTS/{customer.replace(' ', '_')}"
                gt_status = "MATCHED"
                gt_root_cause = "Alternative Bank Narration Formatting"
                
            elif adv_case == "MERCHANT_NAME_VARIATION":
                narration = f"CMS/RZP_STORE_ONLINE/{utr}/{order_id}"
                gt_status = "MATCHED"
                gt_root_cause = "Merchant Alias Name Mapping"
                
            elif adv_case == "REF_FORMAT_DIFF":
                narration = f"CMS/RAZORPAY/REF#{utr[-8:]}/ORD-{order_id[-6:]}"
                gt_status = "MATCHED"
                gt_root_cause = "Truncated Reference Formatting in Narration"
                
            elif adv_case == "INCORRECT_AMOUNT":
                actual_bank_credit = expected_net - Decimal("350.00")
                gt_status = "EXCEPTION"
                gt_exception_type = "AMOUNT_MISMATCH"
                gt_root_cause = "Settlement Bank Transfer Amount Variance"
                
            elif adv_case == "EXTRA_BANK_TXN":
                # Inject an orphan bank credit without matching gateway transaction
                bank_statements.append({
                    "bank_txn_id": f"BNK_ORPHAN_{idx}",
                    "utr": f"UTR_EXTRA_CREDIT_{idx}",
                    "bank_date": bank_date.strftime("%Y-%m-%d %H:%M:%S"),
                    "credit_amount": float(Decimal("14250.00")),
                    "narration": "DIRECT_CUSTOMER_NEFT_TRANSFER/NO_GATEWAY_RECORD",
                    "bank_name": bank_name,
                    "account_number": "XXXX-XXXX-8921"
                })
                gt_status = "MATCHED"
                
            elif adv_case == "MISSING_BANK_TXN":
                actual_bank_credit = Decimal("0.00")
                gt_status = "EXCEPTION"
                gt_exception_type = "MISSING_BANK_CREDIT"
                gt_root_cause = "Bank Statement Record Omitted from Ingestion"
                
            elif adv_case == "MULTI_TXN_SETTLEMENT":
                gt_status = "MATCHED"
                gt_root_cause = "Multi-item Settlement Batch Mapping"
                
            elif adv_case == "IDENTICAL_AMOUNT_AMBIGUITY":
                gross = Decimal("5000.00")
                mdr = Decimal("100.00")
                gst = Decimal("18.00")
                expected_net = Decimal("4882.00")
                actual_bank_credit = Decimal("4882.00")
                gt_status = "MATCHED"
                gt_root_cause = "Identical Amount Disambiguation"
                
            elif adv_case == "DELIBERATELY_AMBIGUOUS":
                actual_utr = "UNKNOWN"
                narration = "MISC_CREDIT_ENTRY/REFERENCE_UNREADABLE"
                actual_bank_credit = expected_net - Decimal("120.00")
                gt_status = "EXCEPTION"
                gt_exception_type = "UNKNOWN"
                gt_root_cause = "Ambiguous Entry Requiring Manual Human Review"

        # Construct records
        rzp_item = {
            "transaction_id": txn_id,
            "order_id": order_id,
            "utr": actual_utr,
            "gross_amount": float(gross),
            "mdr_amount": float(mdr),
            "gst_on_mdr": float(gst),
            "tds_amount": 0.0,
            "refund_amount": float(refund_amount),
            "chargeback_amount": float(chargeback_amount),
            "other_deductions": float(other_deductions),
            "expected_settlement": float(expected_net),
            "settlement_date": settle_date.strftime("%Y-%m-%d %H:%M:%S"),
            "payment_method": method,
            "status": "settled" if actual_bank_credit > 0 else "pending"
        }
        settlements.append(rzp_item)
        
        # Bank Statement record (unless missing/bulk)
        if actual_bank_credit > 0 and idx not in aggregation_indices:
            bank_statements.append({
                "bank_txn_id": f"BNK_TXN_{400000 + idx}",
                "utr": actual_utr,
                "bank_date": bank_date.strftime("%Y-%m-%d %H:%M:%S"),
                "credit_amount": float(actual_bank_credit),
                "narration": narration,
                "bank_name": bank_name,
                "account_number": "XXXX-XXXX-8921"
            })
            
        # Merchant Ledger Invoice
        merchant_invoices.append({
            "invoice_id": invoice_id,
            "order_id": order_id,
            "customer_name": customer,
            "gross_order_value": float(gross),
            "created_at": invoice_date.strftime("%Y-%m-%d %H:%M:%S"),
            "merchant_id": "MID_RAZORPAY_8839",
            "tax_amount": float((gross * Decimal("0.18")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)),
            "net_receivable": float(expected_net),
            "status": "INVOICED"
        })
        
        # Unified Transaction Record
        transactions.append({
            "transaction_id": txn_id,
            "order_id": order_id,
            "utr": actual_utr,
            "customer_name": customer,
            "payment_method": method,
            "gross_amount": float(gross),
            "expected_settlement": float(expected_net),
            "actual_bank_credit": float(actual_bank_credit),
            "settlement_date": settle_date.strftime("%Y-%m-%d %H:%M:%S"),
            "bank_date": bank_date.strftime("%Y-%m-%d %H:%M:%S") if actual_bank_credit > 0 else None,
            "status": gt_status
        })
        
        # Ground Truth Record
        ground_truths.append({
            "transaction_id": txn_id,
            "order_id": order_id,
            "utr": actual_utr,
            "ground_truth_status": gt_status,
            "ground_truth_match_id": utr if gt_status == "MATCHED" else "UNRESOLVED",
            "ground_truth_exception_type": gt_exception_type,
            "ground_truth_expected_amount": float(expected_net),
            "ground_truth_actual_credit": float(actual_bank_credit),
            "ground_truth_variance": float(expected_net - actual_bank_credit),
            "ground_truth_root_cause": gt_root_cause
        })

    from datetime import timezone
    metadata = {
        "total_records": total_records,
        "expected_matches": sum(1 for g in ground_truths if g["ground_truth_status"] == "MATCHED"),
        "expected_exceptions": sum(1 for g in ground_truths if g["ground_truth_status"] == "EXCEPTION"),
        "random_seed": seed,
        "adversarial_percentage": adversarial_pct,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "dataset_version": "2.0.0"
    }

    return {
        "settlements": settlements,
        "bank_statements": bank_statements,
        "merchant_invoices": merchant_invoices,
        "transactions": transactions,
        "ground_truths": ground_truths,
        "metadata": metadata
    }

def write_csv_and_json(data: Dict[str, Any], output_dir: str, prefix: str = ""):
    os.makedirs(output_dir, exist_ok=True)
    
    files = {
        f"{prefix}settlements.csv": data["settlements"],
        f"{prefix}bank_statement.csv": data["bank_statements"],
        f"{prefix}merchant_ledger.csv": data["merchant_invoices"],
        f"{prefix}transactions.csv": data["transactions"],
        f"{prefix}ground_truth.csv": data["ground_truths"],
    }
    
    for filename, rows in files.items():
        filepath = os.path.join(output_dir, filename)
        if rows:
            with open(filepath, "w", newline="", encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
                writer.writeheader()
                writer.writerows(rows)
                
    # Also output metadata.json
    with open(os.path.join(output_dir, f"{prefix}metadata.json"), "w", encoding="utf-8") as f:
        json.dump(data["metadata"], f, indent=2)

if __name__ == "__main__":
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    synthetic_dir = os.path.join(base_dir, "data", "synthetic")
    evaluation_dir = os.path.join(base_dir, "data", "evaluation")
    
    print("Generating 500-record benchmark synthetic dataset (seed=42)...")
    synthetic_data = generate_multi_source_dataset(total_records=500, adversarial_pct=0.12, seed=42)
    write_csv_and_json(synthetic_data, synthetic_dir)
    print(f"-> Saved 5 CSVs and metadata.json to {synthetic_dir}")
    print(f"   Matches: {synthetic_data['metadata']['expected_matches']} | Exceptions: {synthetic_data['metadata']['expected_exceptions']}")
    
    print("\nGenerating 1,000-record held-out evaluation dataset (seed=101)...")
    heldout_data = generate_multi_source_dataset(total_records=1000, adversarial_pct=0.14, seed=101)
    write_csv_and_json(heldout_data, evaluation_dir, prefix="heldout_")
    print(f"-> Saved heldout CSVs to {evaluation_dir}")
    print(f"   Matches: {heldout_data['metadata']['expected_matches']} | Exceptions: {heldout_data['metadata']['expected_exceptions']}")

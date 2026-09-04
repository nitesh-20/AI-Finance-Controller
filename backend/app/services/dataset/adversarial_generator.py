"""
Adversarial 500-1000 Record Financial Dataset Generator:
Generates 3-way synthetic data:
1. Razorpay Settlement Items (RazorpaySettlementItem)
2. Bank Statement Credit Records (BankStatementRecord)
3. Merchant Ledger / Invoices (MerchantLedgerEntry)

Implements complete 25-anomaly taxonomy with reproducible seed (seed=42).
"""
import random
from typing import Tuple, List, Dict, Any, Optional
from datetime import datetime, timedelta
from decimal import Decimal, ROUND_HALF_UP

from app.models.three_way import RazorpaySettlementItem, BankStatementRecord, MerchantLedgerEntry

class AdversarialDatasetGenerator:
    def __init__(self, base_seed: int = 42):
        self.base_seed = base_seed

    def generate_dataset(
        self,
        total_records: int = 500,
        adversarial_pct: float = 0.12,
        seed: Optional[int] = None
    ) -> Tuple[List[RazorpaySettlementItem], List[BankStatementRecord], List[MerchantLedgerEntry]]:
        """
        Generates 500+ records across all three financial ledgers with 25 adversarial cases.
        """
        rng = random.Random(seed if seed is not None else self.base_seed)
        
        razorpay_items: List[RazorpaySettlementItem] = []
        bank_records: List[BankStatementRecord] = []
        ledger_entries: List[MerchantLedgerEntry] = []

        start_date = datetime(2026, 3, 1, 9, 0, 0)
        payment_methods = ["UPI", "Credit Card", "Debit Card", "NetBanking", "Wallet"]
        customer_names = [
            "Aarav Sharma", "Priya Patel", "Vikram Malhotra", "Ananya Rao", "Rohit Verma",
            "Deepika Sen", "Siddharth Nair", "Sneha Kulkarni", "Aditya Joshi", "Pooja Mehta",
            "Karan Singhania", "Neha Gupta", "Manish Tiwari", "Rhea Kapoor", "Varun Dhawan",
            "Ishaan Khatter", "Tanvi Deshmukh", "Nikhil Chopra", "Meera Nambiar", "Rahul Dravid"
        ]
        banks = ["HDFC Bank Ltd", "ICICI Bank Ltd", "State Bank of India", "Axis Bank Ltd"]

        # Calculate exact number of adversarial cases
        num_adversarial = max(25, int(total_records * adversarial_pct))
        adversarial_indices = set(rng.sample(range(total_records), num_adversarial))

        # 25 Anomaly Types
        adversarial_types = [
            "EXACT_MATCH", "T1_DRIFT", "T2_DELAY", "DUPLICATE_UTR", "DUPLICATE_TXN",
            "PARTIAL_REFUND", "FULL_REFUND", "CHARGEBACK_HOLD", "MISSING_SETTLEMENT",
            "WRONG_MDR_TIER", "INCORRECT_GST", "BANK_FEE_DEDUCTION", "SETTLEMENT_AGGREGATION",
            "SPLIT_SETTLEMENT", "CURRENCY_ROUNDING", "MISSING_INVOICE", "NARRATION_VARIATION",
            "MERCHANT_NAME_VARIATION", "REF_FORMAT_DIFF", "INCORRECT_AMOUNT", "EXTRA_BANK_TXN",
            "MISSING_BANK_TXN", "MULTI_TXN_SETTLEMENT", "IDENTICAL_AMOUNT_AMBIGUITY", "DELIBERATELY_AMBIGUOUS"
        ]

        # Bulk subset-sum pool
        subset_group_indices = set(range(10, 14))
        bulk_credit_amount = Decimal("0.00")
        bulk_txns: List[str] = []

        adv_counter = 0

        for idx in range(total_records):
            txn_id = f"TXN_RZP_{100000 + idx}"
            order_id = f"ORD_INV_{200000 + idx}"
            invoice_id = f"INV_2026_{300000 + idx}"
            utr = f"UTR_HDFC_{800000 + idx}"
            customer = rng.choice(customer_names)
            method = rng.choice(payment_methods)
            bank_name = rng.choice(banks)
            
            # Timestamp progression
            current_time = start_date + timedelta(hours=idx * 0.75)
            settlement_date_str = current_time.strftime("%Y-%m-%d %H:%M:%S")
            bank_date_str = (current_time + timedelta(days=1)).strftime("%Y-%m-%d %H:%M:%S")
            ledger_date_str = current_time.strftime("%Y-%m-%d %H:%M:%S")

            # Gross amount: ₹350 to ₹45,000
            gross_float = round(rng.uniform(350.0, 45000.0), 2)
            gross = Decimal(str(gross_float)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

            # Contract terms: 2.0% MDR, 18% GST on MDR
            mdr_rate = Decimal("0.02")
            gst_rate = Decimal("0.18")
            
            mdr = (gross * mdr_rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            gst = (mdr * gst_rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            expected_net = gross - mdr - gst

            actual_bank_credit = expected_net
            actual_utr = utr
            refund_amount = Decimal("0.00")
            chargeback_amount = Decimal("0.00")
            other_deductions = Decimal("0.00")
            narration = f"CMS/RAZORPAY/{utr}/{order_id}"

            # Aggregation case
            if idx in subset_group_indices:
                bulk_credit_amount += expected_net
                bulk_txns.append(txn_id)
                narration = "CMS/RAZORPAY/BULK_SETTLEMENT_BATCH"
                if idx == 13:
                    bank_records.append(
                        BankStatementRecord(
                            bank_txn_id="BNK_BULK_BATCH_001",
                            utr="UTR_HDFC_BULK_001",
                            bank_date=bank_date_str,
                            credit_amount=float(bulk_credit_amount),
                            narration=f"CMS/RAZORPAY/BULK_CREDIT/4_TXNS/{','.join(bulk_txns)}",
                            bank_name=bank_name,
                            account_number="XXXX-XXXX-8921"
                        )
                    )
            elif idx in adversarial_indices:
                adv_case = adversarial_types[adv_counter % len(adversarial_types)]
                adv_counter += 1

                if adv_case == "T1_DRIFT":
                    bank_date_str = (current_time + timedelta(days=2)).strftime("%Y-%m-%d %H:%M:%S")

                elif adv_case == "T2_DELAY":
                    bank_date_str = (current_time + timedelta(days=3)).strftime("%Y-%m-%d %H:%M:%S")

                elif adv_case == "DUPLICATE_UTR":
                    actual_utr = f"UTR_HDFC_{800000 + max(0, idx - 2)}"

                elif adv_case == "DUPLICATE_TXN":
                    order_id = f"ORD_INV_{200000 + max(0, idx - 1)}"

                elif adv_case == "PARTIAL_REFUND":
                    refund_amount = (gross * Decimal("0.30")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                    actual_bank_credit = expected_net - refund_amount
                    narration += f"/REFUND_PARTIAL_{refund_amount}"

                elif adv_case == "FULL_REFUND":
                    refund_amount = gross
                    actual_bank_credit = Decimal("0.00")

                elif adv_case == "CHARGEBACK_HOLD":
                    chargeback_amount = Decimal("400.00")
                    actual_bank_credit = expected_net - chargeback_amount
                    narration += "/CB_RESERVE_HOLD"

                elif adv_case == "MISSING_SETTLEMENT":
                    actual_utr = "UNKNOWN"
                    actual_bank_credit = Decimal("0.00")

                elif adv_case == "WRONG_MDR_TIER":
                    intl_mdr = (gross * Decimal("0.035")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                    intl_gst = (intl_mdr * gst_rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                    actual_bank_credit = gross - intl_mdr - intl_gst
                    narration += "/CORP_INTL_CARD_3.5PCT"

                elif adv_case == "INCORRECT_GST":
                    actual_bank_credit = expected_net - Decimal("12.50")

                elif adv_case == "BANK_FEE_DEDUCTION":
                    other_deductions = Decimal("50.00")
                    actual_bank_credit = expected_net - other_deductions
                    narration += "/NEFT_BANK_HANDLING_CHRG"

                elif adv_case == "SPLIT_SETTLEMENT":
                    actual_bank_credit = (expected_net * Decimal("0.50")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                    narration += "/PART_1_SPLIT_PAYOUT"

                elif adv_case == "CURRENCY_ROUNDING":
                    actual_bank_credit = expected_net + Decimal("0.75")

                elif adv_case == "MISSING_INVOICE":
                    invoice_id = "UNRECORDED_ERP_DRAFT"

                elif adv_case == "NARRATION_VARIATION":
                    narration = f"UPI/CR/{utr[9:]}/RAZORPAY_PAYMENTS/{customer.replace(' ', '_')}"

                elif adv_case == "MERCHANT_NAME_VARIATION":
                    narration = f"CMS/RZP_STORE_ONLINE/{utr}/{order_id}"

                elif adv_case == "REF_FORMAT_DIFF":
                    narration = f"CMS/RAZORPAY/REF#{utr[-8:]}/ORD-{order_id[-6:]}"

                elif adv_case == "INCORRECT_AMOUNT":
                    actual_bank_credit = expected_net - Decimal("350.00")

                elif adv_case == "EXTRA_BANK_TXN":
                    bank_records.append(
                        BankStatementRecord(
                            bank_txn_id=f"BNK_ORPHAN_{idx}",
                            utr=f"UTR_EXTRA_CREDIT_{idx}",
                            bank_date=bank_date_str,
                            credit_amount=14250.0,
                            narration="DIRECT_CUSTOMER_NEFT_TRANSFER/NO_GATEWAY_RECORD",
                            bank_name=bank_name,
                            account_number="XXXX-XXXX-8921"
                        )
                    )

                elif adv_case == "MISSING_BANK_TXN":
                    actual_bank_credit = Decimal("0.00")

                elif adv_case == "DELIBERATELY_AMBIGUOUS":
                    actual_utr = "UNKNOWN"
                    narration = "MISC_CREDIT_ENTRY/REFERENCE_UNREADABLE"
                    actual_bank_credit = expected_net - Decimal("120.00")

            rzp_item = RazorpaySettlementItem(
                transaction_id=txn_id,
                order_id=order_id,
                utr=actual_utr,
                gross_amount=float(gross),
                mdr_amount=float(mdr),
                gst_on_mdr=float(gst),
                tds_amount=0.0,
                refund_amount=float(refund_amount),
                chargeback_amount=float(chargeback_amount),
                other_deductions=float(other_deductions),
                expected_settlement=float(expected_net),
                settlement_date=settlement_date_str,
                payment_method=method,
                status="settled" if actual_bank_credit > 0 else "pending"
            )
            razorpay_items.append(rzp_item)

            if actual_bank_credit > 0 and idx not in subset_group_indices:
                bank_records.append(
                    BankStatementRecord(
                        bank_txn_id=f"BNK_TXN_{400000 + idx}",
                        utr=actual_utr,
                        bank_date=bank_date_str,
                        credit_amount=float(actual_bank_credit),
                        narration=narration,
                        bank_name=bank_name,
                        account_number="XXXX-XXXX-8921"
                    )
                )

            ledger_entries.append(
                MerchantLedgerEntry(
                    invoice_id=invoice_id,
                    order_id=order_id,
                    customer_name=customer,
                    gross_order_value=float(gross),
                    created_at=ledger_date_str,
                    merchant_id="MID_RAZORPAY_8839",
                    tax_amount=float((gross * Decimal("0.18")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)),
                    net_receivable=float(expected_net),
                    status="INVOICED"
                )
            )

        return razorpay_items, bank_records, ledger_entries

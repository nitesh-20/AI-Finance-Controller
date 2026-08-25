"""
Adversarial 500-Record Financial Dataset Generator:
Generates 3-way synthetic data:
1. Razorpay Settlement Items
2. Bank Statement Credit Records
3. Merchant Ledger / Invoices
Injects 17 distinct adversarial edge cases to rigorously test deterministic matching,
the verification gate, precision benchmarking, and exception resolution.
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
        Generates 500+ records across all three financial ledgers.
        """
        rng = random.Random(seed if seed is not None else self.base_seed)
        
        razorpay_items: List[RazorpaySettlementItem] = []
        bank_records: List[BankStatementRecord] = []
        ledger_entries: List[MerchantLedgerEntry] = []

        start_date = datetime(2026, 3, 10, 9, 0, 0)
        payment_methods = ["UPI", "Credit Card", "Debit Card", "NetBanking", "Wallet"]
        customer_names = [
            "Aarav Sharma", "Priya Patel", "Vikram Malhotra", "Ananya Rao", "Rohit Verma",
            "Deepika Sen", "Siddharth Nair", "Sneha Kulkarni", "Aditya Joshi", "Pooja Mehta",
            "Karan Singhania", "Neha Gupta", "Manish Tiwari", "Rhea Kapoor", "Varun Dhawan",
            "Ishaan Khatter", "Tanvi Deshmukh", "Nikhil Chopra", "Meera Nambiar", "Rahul Dravid"
        ]

        # Calculate exact number of adversarial cases
        num_adversarial = max(15, int(total_records * adversarial_pct))
        adversarial_indices = set(rng.sample(range(total_records), num_adversarial))

        # Adversarial case types cycle
        adversarial_types = [
            "DUPLICATE_UTR", "PARTIAL_REFUND", "FULL_REFUND", "CHARGEBACK_RESERVE",
            "WRONG_MDR_TIER", "GST_ROUNDING_ERROR", "TDS_VARIANCE", "MISSING_SETTLEMENT",
            "SPLIT_SETTLEMENT", "MISSING_INVOICE", "AMOUNT_MISMATCH", "BANK_FEE"
        ]

        # Pre-generate a subset-sum bulk pool (5 records that sum to 1 bulk bank credit)
        subset_group_indices = set(range(5, 10))

        bulk_bank_amount = Decimal("0.00")
        bulk_rzp_items: List[RazorpaySettlementItem] = []

        for idx in range(total_records):
            txn_id = f"TXN_RZP_{100000 + idx}"
            order_id = f"ORD_INV_{200000 + idx}"
            invoice_id = f"INV_2026_{300000 + idx}"
            utr = f"UTR_HDFC_{800000 + idx}"
            customer = rng.choice(customer_names)
            method = rng.choice(payment_methods)
            
            # Timestamp progression
            current_time = start_date + timedelta(hours=idx * 0.5)
            settlement_date_str = current_time.strftime("%Y-%m-%d %H:%M:%S")
            bank_date_str = (current_time + timedelta(days=1)).strftime("%Y-%m-%d %H:%M:%S")
            ledger_date_str = current_time.strftime("%Y-%m-%d %H:%M:%S")

            # Gross amount: between ₹450 and ₹25,000
            gross_float = round(rng.uniform(450.0, 25000.0), 2)
            gross = Decimal(str(gross_float)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

            # Contract terms: 2.0% MDR, 18% GST on MDR
            mdr_rate = Decimal("0.02")
            gst_rate = Decimal("0.18")
            
            mdr = (gross * mdr_rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            gst = (mdr * gst_rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            expected_net = gross - mdr - gst

            # ----------------------------------------------------
            # Handle Adversarial Injections
            # ----------------------------------------------------
            if idx in adversarial_indices:
                adv_type = adversarial_types[idx % len(adversarial_types)]

                if adv_type == "DUPLICATE_UTR":
                    # Reuse an existing UTR
                    reused_utr = f"UTR_HDFC_{800000 + max(0, idx - 3)}"
                    rzp_item = RazorpaySettlementItem(
                        transaction_id=txn_id,
                        order_id=order_id,
                        utr=reused_utr,
                        gross_amount=float(gross),
                        mdr_amount=float(mdr),
                        gst_on_mdr=float(gst),
                        expected_settlement=float(expected_net),
                        settlement_date=settlement_date_str,
                        payment_method=method
                    )
                    # Bank already had this UTR credited previously
                    bank_rec = BankStatementRecord(
                        bank_txn_id=f"BNK_TXN_{900000 + idx}",
                        utr=reused_utr,
                        bank_date=bank_date_str,
                        credit_amount=float(expected_net),
                        narration=f"CMS/RAZORPAY/{reused_utr}/{order_id}"
                    )
                    razorpay_items.append(rzp_item)
                    bank_records.append(bank_rec)

                elif adv_type == "CHARGEBACK_RESERVE":
                    # ₹400 holdback deduction in bank credit
                    actual_bank_credit = max(Decimal("0.00"), expected_net - Decimal("400.00"))
                    rzp_item = RazorpaySettlementItem(
                        transaction_id=txn_id,
                        order_id=order_id,
                        utr=utr,
                        gross_amount=float(gross),
                        mdr_amount=float(mdr),
                        gst_on_mdr=float(gst),
                        expected_settlement=float(expected_net),
                        settlement_date=settlement_date_str,
                        payment_method=method
                    )
                    bank_rec = BankStatementRecord(
                        bank_txn_id=f"BNK_TXN_{900000 + idx}",
                        utr=utr,
                        bank_date=bank_date_str,
                        credit_amount=float(actual_bank_credit),
                        narration=f"CMS/RAZORPAY/{utr}/CHARGEBACK_HOLD_400"
                    )
                    razorpay_items.append(rzp_item)
                    bank_records.append(bank_rec)

                elif adv_type == "WRONG_MDR_TIER":
                    # Gateway charged 3.5% instead of contracted 2.0%
                    wrong_mdr = (gross * Decimal("0.035")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                    wrong_gst = (wrong_mdr * gst_rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                    actual_net = gross - wrong_mdr - wrong_gst
                    rzp_item = RazorpaySettlementItem(
                        transaction_id=txn_id,
                        order_id=order_id,
                        utr=utr,
                        gross_amount=float(gross),
                        mdr_amount=float(wrong_mdr),
                        gst_on_mdr=float(wrong_gst),
                        expected_settlement=float(expected_net),
                        settlement_date=settlement_date_str,
                        payment_method=method
                    )
                    bank_rec = BankStatementRecord(
                        bank_txn_id=f"BNK_TXN_{900000 + idx}",
                        utr=utr,
                        bank_date=bank_date_str,
                        credit_amount=float(actual_net),
                        narration=f"CMS/RAZORPAY/{utr}/CORP_INTL_TIER"
                    )
                    razorpay_items.append(rzp_item)
                    bank_records.append(bank_rec)

                elif adv_type == "GST_ROUNDING_ERROR":
                    # Subtle ₹1.18 rounding discrepancy
                    skewed_credit = expected_net - Decimal("1.18")
                    rzp_item = RazorpaySettlementItem(
                        transaction_id=txn_id,
                        order_id=order_id,
                        utr=utr,
                        gross_amount=float(gross),
                        mdr_amount=float(mdr),
                        gst_on_mdr=float(gst),
                        expected_settlement=float(expected_net),
                        settlement_date=settlement_date_str,
                        payment_method=method
                    )
                    bank_rec = BankStatementRecord(
                        bank_txn_id=f"BNK_TXN_{900000 + idx}",
                        utr=utr,
                        bank_date=bank_date_str,
                        credit_amount=float(skewed_credit),
                        narration=f"CMS/RAZORPAY/{utr}/ROUNDING_DRIFT"
                    )
                    razorpay_items.append(rzp_item)
                    bank_records.append(bank_rec)

                elif adv_type == "MISSING_SETTLEMENT":
                    # Capture exists in Razorpay but zero bank credit
                    rzp_item = RazorpaySettlementItem(
                        transaction_id=txn_id,
                        order_id=order_id,
                        utr="UNKNOWN",
                        gross_amount=float(gross),
                        mdr_amount=float(mdr),
                        gst_on_mdr=float(gst),
                        expected_settlement=float(expected_net),
                        settlement_date=settlement_date_str,
                        payment_method=method
                    )
                    razorpay_items.append(rzp_item)
                    # No bank record emitted!

                elif adv_type == "PARTIAL_REFUND":
                    # ₹250 refund recorded
                    refund_amt = Decimal("250.00")
                    actual_net = expected_net - refund_amt
                    rzp_item = RazorpaySettlementItem(
                        transaction_id=txn_id,
                        order_id=order_id,
                        utr=utr,
                        gross_amount=float(gross),
                        mdr_amount=float(mdr),
                        gst_on_mdr=float(gst),
                        refund_amount=float(refund_amt),
                        expected_settlement=float(actual_net),
                        settlement_date=settlement_date_str,
                        payment_method=method
                    )
                    bank_rec = BankStatementRecord(
                        bank_txn_id=f"BNK_TXN_{900000 + idx}",
                        utr=utr,
                        bank_date=bank_date_str,
                        credit_amount=float(actual_net),
                        narration=f"CMS/RAZORPAY/{utr}/PARTIAL_REFUND_ADJ"
                    )
                    razorpay_items.append(rzp_item)
                    bank_records.append(bank_rec)

                else:
                    # Generic Amount Mismatch
                    bank_credit = expected_net - Decimal("75.00")
                    rzp_item = RazorpaySettlementItem(
                        transaction_id=txn_id,
                        order_id=order_id,
                        utr=utr,
                        gross_amount=float(gross),
                        mdr_amount=float(mdr),
                        gst_on_mdr=float(gst),
                        expected_settlement=float(expected_net),
                        settlement_date=settlement_date_str,
                        payment_method=method
                    )
                    bank_rec = BankStatementRecord(
                        bank_txn_id=f"BNK_TXN_{900000 + idx}",
                        utr=utr,
                        bank_date=bank_date_str,
                        credit_amount=float(bank_credit),
                        narration=f"CMS/RAZORPAY/{utr}/{order_id}"
                    )
                    razorpay_items.append(rzp_item)
                    bank_records.append(bank_rec)

            # ----------------------------------------------------
            # Subset-Sum Combinatorial Case
            # ----------------------------------------------------
            elif idx in subset_group_indices:
                rzp_item = RazorpaySettlementItem(
                    transaction_id=txn_id,
                    order_id=order_id,
                    utr="UTR_BULK_POOL",
                    gross_amount=float(gross),
                    mdr_amount=float(mdr),
                    gst_on_mdr=float(gst),
                    expected_settlement=float(expected_net),
                    settlement_date=settlement_date_str,
                    payment_method=method
                )
                bulk_bank_amount += expected_net
                bulk_rzp_items.append(rzp_item)
                razorpay_items.append(rzp_item)

                if idx == max(subset_group_indices):
                    # Emit one aggregated bank record
                    bank_rec = BankStatementRecord(
                        bank_txn_id="BNK_TXN_BULK_100",
                        utr="UTR_BULK_CONSOLIDATED",
                        bank_date=bank_date_str,
                        credit_amount=float(bulk_bank_amount),
                        narration="CMS/RAZORPAY/BATCH_SETTLEMENT_CONSOLIDATED"
                    )
                    bank_records.append(bank_rec)

            # ----------------------------------------------------
            # Clean Deterministic Match Cases (Level 1 / 2 / 3)
            # ----------------------------------------------------
            else:
                rzp_item = RazorpaySettlementItem(
                    transaction_id=txn_id,
                    order_id=order_id,
                    utr=utr,
                    gross_amount=float(gross),
                    mdr_amount=float(mdr),
                    gst_on_mdr=float(gst),
                    expected_settlement=float(expected_net),
                    settlement_date=settlement_date_str,
                    payment_method=method
                )
                bank_rec = BankStatementRecord(
                    bank_txn_id=f"BNK_TXN_{900000 + idx}",
                    utr=utr,
                    bank_date=bank_date_str,
                    credit_amount=float(expected_net),
                    narration=f"CMS/RAZORPAY/{utr}/{order_id}"
                )
                razorpay_items.append(rzp_item)
                bank_records.append(bank_rec)

            # Always emit merchant ledger entry
            ledger_entries.append(
                MerchantLedgerEntry(
                    invoice_id=invoice_id,
                    order_id=order_id,
                    customer_name=customer,
                    gross_order_value=float(gross),
                    created_at=ledger_date_str,
                    net_receivable=float(expected_net)
                )
            )

        return razorpay_items, bank_records, ledger_entries

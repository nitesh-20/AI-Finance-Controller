"""
Seed Data Script: Generates and validates synthetic transaction datasets.
"""
import json
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "data", "synthetic", "synthetic_transactions.json")

def validate_dataset():
    if not os.path.exists(DATA_PATH):
        print(f"Error: {DATA_PATH} not found.")
        return False
    with open(DATA_PATH, "r") as f:
        records = json.load(f)
    print(f"Successfully loaded {len(records)} synthetic financial transactions.")
    return True

if __name__ == "__main__":
    validate_dataset()

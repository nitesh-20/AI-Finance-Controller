#!/bin/bash
# Comprehensive Test Runner for AI Finance Controller
set -e

echo "=== Running Backend Financial Engine & Multi-Agent Tests ==="
PYTHONPATH=backend python3 -m unittest discover -s backend/tests -p "test_*.py"

echo "=== Running Frontend Typecheck and Build ==="
(cd frontend && npm run build)

echo "=== All Tests & Builds Passed Successfully ==="

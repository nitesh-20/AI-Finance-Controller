#!/bin/bash
# Production Launch Script
set -e

echo "Building frontend production bundle..."
(cd frontend && npm run build)

echo "Starting FastAPI Production Server..."
cd backend && PYTHONPATH=. uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 4

#!/bin/bash
# Start backend and frontend services concurrently for development
set -e

echo "Starting AI Finance Controller in Development Mode..."

# 1. Start Backend FastAPI
echo "Launching FastAPI Backend on http://localhost:8000..."
(cd backend && PYTHONPATH=. uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload) &
BACKEND_PID=$!

# 2. Start Frontend Vite Dev Server
echo "Launching React Frontend on http://localhost:5173..."
(cd frontend && npm run dev) &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait

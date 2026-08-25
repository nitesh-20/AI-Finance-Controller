# REST & Voice API Documentation

The AI Finance Controller exposes high-performance REST endpoints under the `/api` prefix.

## Endpoints Overview

### Reconciliation & Transactions
- `GET /api/reconciliation/records` - Ingested transaction records with reconciliation classification.
- `POST /api/reconciliation/run` - Trigger real-time reconciliation pass.
- `GET /api/reconciliation/audit/{txn_id}` - 10-step mathematical audit proof for a single transaction.

### Settlement Intelligence
- `GET /api/settlements/batches` - Settlement batch list and status.
- `GET /api/settlements/overview` - Net settled, pending holdbacks, and discrepancy metrics.

### Exceptions & Operations
- `GET /api/exceptions` - Priority exception queue.
- `PATCH /api/exceptions/{id}/status` - Update exception status (`INVESTIGATING`, `RESOLVED`, `OPEN`).
- `POST /api/actions/execute` - Autonomous action execution (`DISPUTE_RAZORPAY`, `QUARANTINE`, `REFUND_DUPLICATE`, `JOURNAL_ADJUSTMENT`).

### Cash Position & Forecast
- `GET /api/cash/position` - Current available cash and obligations.
- `GET /api/cash/forecast` - 7-day rolling cash inflow/outflow forecast.

### AI Copilot & Voice Agent
- `POST /api/agent/chat` - Natural language copilot query with tool execution traces.
- `POST /api/voice/query` - Voice interface endpoint returning TTS-optimized speech and UI cards.

### System & Health
- `GET /api/health` - Health check status.
- `GET /api/health-score` - Dynamic Finance Health Score (0-100) with sub-scores.

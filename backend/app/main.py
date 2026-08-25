from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .core.logging import setup_logging, logger
from .api import (
    reconciliation, settlements, exceptions, cash, insights, 
    agent, reports, audit, health_router, action_router, 
    performance, dataset
)

setup_logging()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Autonomous AI Finance Controller & Reconciliation Platform (Razorpay Track 04)"
)

# CORS configuration for frontend pairing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all API routers under /api
app.include_router(reconciliation.router, prefix=settings.API_PREFIX)
app.include_router(settlements.router, prefix=settings.API_PREFIX)
app.include_router(exceptions.router, prefix=settings.API_PREFIX)
app.include_router(cash.router, prefix=settings.API_PREFIX)
app.include_router(insights.router, prefix=settings.API_PREFIX)
app.include_router(agent.router, prefix=settings.API_PREFIX)
app.include_router(reports.router, prefix=settings.API_PREFIX)
app.include_router(audit.router, prefix=settings.API_PREFIX)
app.include_router(performance.router, prefix=settings.API_PREFIX)
app.include_router(dataset.router, prefix=settings.API_PREFIX)
app.include_router(health_router.router, prefix=settings.API_PREFIX)
app.include_router(action_router.router, prefix=settings.API_PREFIX)

@app.get("/api/health")
@app.get("/api/v1/health")
@app.get("/api/v1/ready")
@app.get("/health")
@app.get("/ready")
async def health_check():
    return {
        "status": "ok",
        "service": "AI Finance Controller Python Engine",
        "version": settings.VERSION,
        "track": "Razorpay Buildathon Track 04: AI Finance Controller"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)

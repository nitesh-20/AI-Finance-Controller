import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "AI Finance Controller"
    VERSION: str = "2.0.0"
    API_PREFIX: str = "/api"
    ENV: str = os.getenv("ENV", "development")
    PORT: int = int(os.getenv("PORT", "8000"))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", os.getenv("VITE_GEMINI_API_KEY", ""))
    
    # Financial Engine Defaults
    DEFAULT_GATEWAY_FEE_RATE: float = 0.02  # 2.0% MDR
    DEFAULT_GST_RATE: float = 0.18  # 18% GST on MDR
    DEFAULT_TDS_RATE: float = 0.01  # 1.0% Section 194-O TDS
    
    # Matching Tolerance Bounds (in INR)
    EXACT_MATCH_TOLERANCE: float = 0.05       # <= ₹0.05 considered clean match
    GST_ROUNDING_TOLERANCE: float = 1.50      # <= ₹1.50 classified as GST rounding difference
    LARGE_VARIANCE_THRESHOLD: float = 1000.0  # >= ₹1,000 flagged as Critical Severity

settings = Settings()


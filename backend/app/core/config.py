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

settings = Settings()

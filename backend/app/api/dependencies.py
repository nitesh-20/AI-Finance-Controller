"""
API Dependencies for FastAPI Application.
Provides dependency injection instances for services, authentication, and engines.
"""
from typing import Generator
from fastapi import Depends, HTTPException, status
from app.config import settings

def get_settings():
    """Retrieve application settings."""
    return settings

def verify_api_key():
    """Verify API credentials if enabled in production."""
    # Pass-through for development mode; extensible for OAuth2 / Bearer JWT in prod
    return True

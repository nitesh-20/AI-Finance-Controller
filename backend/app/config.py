"""
Application Configuration Module
Re-exports settings from core.config for modular imports.
"""
import os
from pydantic import BaseModel
from app.core.config import Settings, settings

__all__ = ["Settings", "settings"]

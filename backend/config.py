"""
Application configuration — loads from environment variables with sensible defaults.
For local development, everything runs with SQLite fallback so no external DB needed.
"""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # ── App ──
    APP_NAME: str = "Smart Logistics AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # ── Database ──
    # Default to SQLite for easy local dev; switch to PostgreSQL in production
    DATABASE_URL: str = "sqlite+aiosqlite:///./logistics.db"
    # For PostgreSQL: "postgresql+asyncpg://user:pass@localhost:5432/logistics"

    # ── Google Maps ──
    GOOGLE_MAPS_API_KEY: str = ""

    # ── WebSocket ──
    WS_HEARTBEAT_INTERVAL: int = 30  # seconds

    # ── AI Engine ──
    RISK_HIGH_THRESHOLD: int = 70
    RISK_MEDIUM_THRESHOLD: int = 40
    FORECAST_HORIZON_DAYS: int = 30
    MODEL_RETRAIN_INTERVAL_HOURS: int = 24

    # ── Kafka (mock by default) ──
    KAFKA_BOOTSTRAP_SERVERS: str = "localhost:9092"
    KAFKA_ENABLED: bool = False

    # ── CORS ──
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()

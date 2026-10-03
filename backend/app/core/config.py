from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    PROJECT_NAME: str = "STORE STING"
    TAGLINE: str = "Shopping, reimagined."
    API_V1_STR: str = "/api"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres@127.0.0.1:5433/storesting"

    # Security
    SECRET_KEY: str = "store-sting-ultra-secret-2050-future-commerce-key-999"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Orchestrator & Worker
    WORKER_POLL_INTERVAL_SEC: float = 1.0
    SIMULATION_MODE: bool = True
    DEFAULT_SEED: int = 42

    # CORS
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://store-sting.netlify.app",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="allow",
    )


settings = Settings()

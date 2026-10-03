from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.database.session import get_db

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "STORE STING API",
        "engine": "Soft Future Commerce 2050",
    }


@router.get("/health/database")
async def database_health(db: AsyncSession = Depends(get_db)):
    try:
        await db.execute(text("SELECT 1"))
        return {
            "database": "connected",
            "dialect": "PostgreSQL 18",
            "driver": "asyncpg",
            "status": "operational",
        }
    except Exception as e:
        return {
            "database": "error",
            "detail": str(e),
            "status": "degraded",
        }

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import structlog

from app.core.config import settings
from app.database.session import engine
from app.database.base import Base
from app.api import (
    auth, categories, products, search, cart, wishlist,
    orders, stream, recommendations, reviews, notifications,
    admin, health
)

logger = structlog.get_logger("storesting")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing STORE STING commerce platform...", environment=settings.ENVIRONMENT)
    # Ensure database tables exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database schema validated.")
    yield
    logger.info("Shutting down STORE STING engine.")
    await engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Shopping, reimagined. A calm, intelligent e-commerce platform built for 2050.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permits local dev and deployment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(health.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(categories.router, prefix="/api")
app.include_router(products.router, prefix="/api")
app.include_router(search.router, prefix="/api")
app.include_router(cart.router, prefix="/api")
app.include_router(wishlist.router, prefix="/api")
app.include_router(orders.router, prefix="/api")
app.include_router(stream.router, prefix="/api")
app.include_router(recommendations.router, prefix="/api")
app.include_router(reviews.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(admin.router, prefix="/api")


@app.get("/")
async def root():
    return {
        "brand": "STORE STING",
        "tagline": "Shopping, reimagined.",
        "documentation": "/docs",
        "api_v1": "/api",
    }

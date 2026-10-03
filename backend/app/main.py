import time
from collections import defaultdict
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
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
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory sliding-window rate limiter for sensitive endpoints
_rate_limit_records = defaultdict(list)
RATE_LIMIT_RULES = {
    ("/api/auth/login", "POST"): (20, 60),      # 20 attempts per minute per IP
    ("/api/auth/register", "POST"): (10, 60),   # 10 registrations per minute per IP
}


@app.middleware("http")
async def security_and_rate_limit_middleware(request: Request, call_next):
    # 1. Rate limiting check for authentication/sensitive routes
    normalized_path = request.url.path.rstrip("/")
    rule_key = (normalized_path, request.method.upper())
    if rule_key in RATE_LIMIT_RULES:
        max_reqs, window_sec = RATE_LIMIT_RULES[rule_key]
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        tracker_key = f"{rule_key[0]}:{client_ip}"

        recent = [t for t in _rate_limit_records[tracker_key] if now - t < window_sec]
        if len(recent) >= max_reqs:
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please wait before retrying."},
                headers={"Retry-After": str(int(window_sec))},
            )
        recent.append(now)
        _rate_limit_records[tracker_key] = recent

    # 2. Call next handler
    response = await call_next(request)

    # 3. Inject standard security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    if settings.ENVIRONMENT == "production":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

    return response

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

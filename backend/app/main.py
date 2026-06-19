from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.db import init_db
from app.api import auth, books, libraries, recommendations, users, admin
from app.core.middleware import RateLimitMiddleware, RequestLoggingMiddleware, ExceptionHandlingMiddleware
import logging
import time

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("litrealm")

app = FastAPI(
    title="LitRealm - Intelligent Book Recommendation API",
    version="2.0.0",
    description="Hybrid ML-powered book recommendation system with TF-IDF and collaborative filtering",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(ExceptionHandlingMiddleware)
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(RateLimitMiddleware, requests_per_minute=120)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://litrealm.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(books.router, prefix="/api/v1/books", tags=["Books"])
app.include_router(libraries.router, prefix="/api/v1/libraries", tags=["Libraries"])
app.include_router(recommendations.router, prefix="/api/v1/recommendations", tags=["Recommendations"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["Admin"])

app.include_router(auth.router, prefix="/auth", tags=["Auth (legacy)"])
app.include_router(books.router, prefix="/books", tags=["Books (legacy)"])
app.include_router(libraries.router, prefix="/libraries", tags=["Libraries (legacy)"])
app.include_router(recommendations.router, prefix="/recommendations", tags=["Recommendations (legacy)"])
app.include_router(users.router, prefix="/users", tags=["Users (legacy)"])
app.include_router(admin.router, prefix="/admin", tags=["Admin (legacy)"])


@app.on_event("startup")
async def startup_event():
    logger.info("Starting LitRealm API v2.0.0")
    init_db()
    logger.info("Database initialized")


@app.get("/health")
async def health_check():
    from app.db import SessionLocal
    from sqlalchemy import text
    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
        db_status = "healthy"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
    finally:
        db.close()

    return {
        "status": "ok",
        "version": "2.0.0",
        "database": db_status,
        "timestamp": time.time()
    }


@app.get("/")
async def root():
    return {
        "name": "LitRealm API",
        "version": "2.0.0",
        "docs": "/docs",
        "health": "/health"
    }

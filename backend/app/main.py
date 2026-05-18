from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, books, libraries

app = FastAPI(title="Intelligent Book Recommendation API", version="0.1.0")

# CORS configuration for frontend interaction
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, set specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(books.router, prefix="/books", tags=["Books"])
app.include_router(libraries.router, prefix="/libraries", tags=["Libraries"])

@app.get("/health")
async def health_check():
    return {"status": "ok"}

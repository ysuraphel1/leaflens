"""LeafLens — FastAPI application entry point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.config import UPLOAD_DIR
from backend.db import init_db
from backend.routers import care, history, identify, journal


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="LeafLens API",
    description="Plant identification and care assistant powered by GPT-4o Vision.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded images
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

app.include_router(identify.router)
app.include_router(care.router)
app.include_router(journal.router)
app.include_router(history.router)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "service": "LeafLens"}

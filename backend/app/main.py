import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine
from app.routes.auth import router as auth_router
from app.routes.dashboard import router as dashboard_router
from app.routes.rooms import router as rooms_router
from app.ws.endpoint import router as ws_router

logger = logging.getLogger(__name__)

# NOTE: asyncpg on Windows requires SelectorEventLoop.
# For local dev on Windows, set this in your terminal before running:
#   $env:PYTHONASYNCIODEBUG=0
# Or add to a local dev script. Not needed on Linux (deploy target).


@asynccontextmanager
async def lifespan(application: FastAPI):
    """Manage startup and shutdown of shared resources."""
    logger.info("Application startup: connection pool initialising")
    yield
    logger.info("Application shutdown: disposing connection pool")
    await engine.dispose()


app = FastAPI(
    title="StudyRoom API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(rooms_router)
app.include_router(dashboard_router)
app.include_router(ws_router)


@app.get("/health", tags=["system"])
async def health():
    """Liveness check. Returns 200 if the process is running."""
    return {"status": "ok"}
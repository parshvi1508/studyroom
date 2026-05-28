import asyncio
import logging
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine
from app.routes.auth import router as auth_router
from app.routes.rooms import router as rooms_router
from app.ws.endpoint import router as ws_router

logger = logging.getLogger(__name__)

# Dev-only: asyncpg requires SelectorEventLoop on Windows.
# Remove this block before deploying to Linux (Azure App Service).
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())


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
app.include_router(ws_router)


@app.get("/health", tags=["system"])
async def health():
    """Liveness check. Returns 200 if the process is running."""
    return {"status": "ok"}
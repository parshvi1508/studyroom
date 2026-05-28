import asyncio
import sys

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from fastapi import FastAPI

from app.routes.auth import router as auth_router
from app.routes.rooms import router as rooms_router

app = FastAPI(title="StudyRoom API")
app.include_router(auth_router)
app.include_router(rooms_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
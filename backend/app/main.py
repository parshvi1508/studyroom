import asyncio
import sys

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from fastapi import FastAPI

app = FastAPI(title="StudyRoom API")

@app.get("/health")
async def health():
    return {"status": "ok"}
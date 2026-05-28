"""Dashboard route for user study statistics."""

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.routes.auth import get_current_user_id
from app.schemas.dashboard import DashboardResponse
from app.services.session_service import session_service

router = APIRouter(prefix="/users/me", tags=["dashboard"])


@router.get("/dashboard", response_model=DashboardResponse)
async def get_dashboard(
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> DashboardResponse:
    """Return session history, total study time, and rooms created for the current user."""
    return await session_service.get_dashboard(session=db, user_id=user_id)

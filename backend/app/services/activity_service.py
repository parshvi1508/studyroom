"""Business logic for activity log retrieval."""

import logging
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.activity_log import ActivityLog

logger = logging.getLogger(__name__)


class ActivityService:
    """Handles activity log reads.

    Receives an AsyncSession from the caller. Does not manage
    sessions or commits.
    """

    async def get_recent(
        self,
        session: AsyncSession,
        room_id: uuid.UUID,
        limit: int = 100,
    ) -> list:
        """Return the most recent activity log entries for a room, oldest first."""
        stmt = (
            select(
                ActivityLog.id,
                ActivityLog.user_id,
                ActivityLog.event_type,
                ActivityLog.event_metadata,
                ActivityLog.occurred_at,
            )
            .where(ActivityLog.room_id == room_id)
            .order_by(ActivityLog.occurred_at.asc())
            .limit(limit)
        )
        result = await session.execute(stmt)
        return result.all()


activity_service = ActivityService()

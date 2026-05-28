"""Business logic for study session lifecycle."""

import logging
import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.session import Session
from app.models.activity_log import ActivityLog

logger = logging.getLogger(__name__)


class SessionService:
    """Handles session start/end lifecycle with database interactions.

    Each method receives an AsyncSession from the caller.
    This class does not manage sessions or commits.
    """

    async def get_active(
        self,
        session: AsyncSession,
        room_id: uuid.UUID,
    ) -> Session | None:
        """Return the active session for a room, or None."""
        stmt = (
            select(Session)
            .where(Session.room_id == room_id)
            .where(Session.status == "active")
        )
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    async def start(
        self,
        session: AsyncSession,
        room_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> Session:
        """Start a new session in a room.

        Raises ValueError if a session is already active.
        """
        existing = await self.get_active(session, room_id)
        if existing is not None:
            raise ValueError("A session is already active in this room")

        new_session = Session(
            room_id=room_id,
            started_by=user_id,
        )
        session.add(new_session)

        activity = ActivityLog(
            room_id=room_id,
            user_id=user_id,
            event_type="session_started",
        )
        session.add(activity)

        await session.flush()
        logger.info("Session started: room=%s, user=%s", room_id, user_id)
        return new_session

    async def end(
        self,
        session: AsyncSession,
        room_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> Session:
        """End the active session in a room.

        Raises ValueError if no session is active.
        """
        active = await self.get_active(session, room_id)
        if active is None:
            raise ValueError("No active session in this room")

        now = datetime.now(timezone.utc)
        duration = int((now - active.start_time).total_seconds())

        active.end_time = now
        active.duration_seconds = duration
        active.status = "ended"

        activity = ActivityLog(
            room_id=room_id,
            user_id=user_id,
            event_type="session_ended",
            event_metadata={"duration_seconds": duration},
        )
        session.add(activity)

        await session.flush()
        logger.info(
            "Session ended: room=%s, duration=%ds",
            room_id,
            duration,
        )
        return active

    async def log_user_joined(
        self,
        session: AsyncSession,
        room_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> None:
        """Write a user_joined event to the activity log."""
        activity = ActivityLog(
            room_id=room_id,
            user_id=user_id,
            event_type="user_joined",
        )
        session.add(activity)
        await session.flush()

    async def log_user_left(
        self,
        session: AsyncSession,
        room_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> None:
        """Write a user_left event to the activity log."""
        activity = ActivityLog(
            room_id=room_id,
            user_id=user_id,
            event_type="user_left",
        )
        session.add(activity)
        await session.flush()


session_service = SessionService()

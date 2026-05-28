"""Business logic for study session lifecycle and user dashboard."""

import logging
import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.activity_log import ActivityLog
from app.models.room import Room
from app.models.session import Session
from app.schemas.dashboard import DashboardResponse, SessionHistoryItem

logger = logging.getLogger(__name__)


class SessionService:
    """Handles session start/end lifecycle and dashboard aggregation.

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

    async def get_dashboard(
        self,
        session: AsyncSession,
        user_id: uuid.UUID,
    ) -> DashboardResponse:
        """Return aggregated dashboard data for a user.

        Runs 3 queries (no N+1):
        1. Aggregate SUM + COUNT on sessions
        2. Session history with room name via JOIN
        3. COUNT on rooms
        """
        # Query 1: aggregates from ended sessions
        agg_stmt = select(
            func.coalesce(func.sum(Session.duration_seconds), 0),
            func.count(Session.id),
        ).where(
            Session.started_by == user_id,
            Session.status == "ended",
        )
        agg_result = await session.execute(agg_stmt)
        total_seconds, session_count = agg_result.one()

        # Query 2: session history with room name (single JOIN, no N+1)
        history_stmt = (
            select(
                Session.id,
                Room.name,
                Room.code,
                Session.start_time,
                Session.end_time,
                Session.duration_seconds,
            )
            .join(Room, Session.room_id == Room.id)
            .where(
                Session.started_by == user_id,
                Session.status == "ended",
            )
            .order_by(Session.start_time.desc())
            .limit(20)
        )
        history_result = await session.execute(history_stmt)
        history = [
            SessionHistoryItem(
                session_id=row.id,
                room_name=row.name,
                room_code=row.code,
                start_time=row.start_time,
                end_time=row.end_time,
                duration_seconds=row.duration_seconds,
            )
            for row in history_result.all()
        ]

        # Query 3: rooms created count
        rooms_stmt = select(func.count(Room.id)).where(
            Room.creator_id == user_id,
        )
        rooms_result = await session.execute(rooms_stmt)
        rooms_created = rooms_result.scalar_one()

        return DashboardResponse(
            total_study_seconds=total_seconds,
            session_count=session_count,
            rooms_created=rooms_created,
            session_history=history,
        )


session_service = SessionService()

"""Business logic for chat message persistence."""

import logging
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.message import Message
from app.models.user import User

logger = logging.getLogger(__name__)


class MessageService:
    """Handles chat message persistence.

    Receives an AsyncSession from the caller. Does not manage
    sessions or commits.
    """

    async def save(
        self,
        session: AsyncSession,
        room_id: uuid.UUID,
        user_id: uuid.UUID,
        content: str,
    ) -> Message:
        """Persist a chat message and return the created Message object."""
        message = Message(
            room_id=room_id,
            user_id=user_id,
            content=content,
        )
        session.add(message)
        await session.flush()
        logger.info("Message saved: room=%s, user=%s", room_id, user_id)
        return message

    async def get_history(
        self,
        session: AsyncSession,
        room_id: uuid.UUID,
        limit: int = 50,
    ) -> list:
        """Return the most recent messages for a room, oldest first.

        JOINs User to include display_name. Returns a list of named rows.
        """
        stmt = (
            select(
                Message.id,
                Message.user_id,
                User.display_name,
                Message.content,
                Message.sent_at,
            )
            .join(User, Message.user_id == User.id)
            .where(Message.room_id == room_id)
            .order_by(Message.sent_at.asc())
            .limit(limit)
        )
        result = await session.execute(stmt)
        return result.all()


message_service = MessageService()

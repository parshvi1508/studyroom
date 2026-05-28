"""Business logic for chat message persistence."""

import logging
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.message import Message

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


message_service = MessageService()

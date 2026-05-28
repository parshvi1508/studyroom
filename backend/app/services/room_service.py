"""Business logic for room creation, retrieval, listing, and deactivation."""

import logging
import secrets
import string
import uuid
from typing import Optional

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.room import Room
from app.models.user import User
from app.schemas.room import RoomResponse

logger = logging.getLogger(__name__)

# ADR-009: exclude 0, O, I, 1 for readability
ROOM_CODE_ALPHABET = string.ascii_uppercase + string.digits
ROOM_CODE_ALPHABET = "".join(
    c for c in ROOM_CODE_ALPHABET if c not in "0OI1"
)
ROOM_CODE_LENGTH = 6
MAX_CODE_RETRIES = 5


class RoomService:
    """Handles room-related business logic with database interactions.

    Each method receives an AsyncSession from the route layer via
    dependency injection. This class does not manage sessions or commits.
    """

    def _generate_code(self) -> str:
        """Generate a random 6-character room code per ADR-009."""
        return "".join(secrets.choice(ROOM_CODE_ALPHABET) for _ in range(ROOM_CODE_LENGTH))

    def _build_response(self, room: Room, creator_display_name: str) -> RoomResponse:
        """Build a RoomResponse from a Room model and creator display name."""
        return RoomResponse(
            id=room.id,
            name=room.name,
            code=room.code,
            creator_id=room.creator_id,
            creator_display_name=creator_display_name,
            created_at=room.created_at,
            is_active=room.is_active,
        )

    async def create(
        self,
        session: AsyncSession,
        name: str,
        creator_id: uuid.UUID,
    ) -> RoomResponse:
        """Create a new room with a unique code.

        Retries up to 5 times on code collision per ADR-009.
        Returns RoomResponse with creator display name.
        Raises RuntimeError after 5 failed attempts.
        """
        creator = await session.get(User, creator_id)

        for attempt in range(MAX_CODE_RETRIES):
            code = self._generate_code()
            room = Room(
                name=name,
                code=code,
                creator_id=creator_id,
            )
            session.add(room)
            try:
                await session.flush()
                logger.info("Room created: code=%s, creator=%s", code, creator_id)
                return self._build_response(room, creator.display_name)
            except IntegrityError:
                await session.rollback()
                logger.warning(
                    "Room code collision: code=%s, attempt=%d",
                    code,
                    attempt + 1,
                )

        raise RuntimeError("Failed to generate unique room code after %d attempts" % MAX_CODE_RETRIES)

    async def get_by_code(
        self,
        session: AsyncSession,
        code: str,
    ) -> Optional[RoomResponse]:
        """Return a room by its code with creator display name, or None if not found."""
        stmt = (
            select(Room, User.display_name)
            .join(User, Room.creator_id == User.id)
            .where(Room.code == code)
        )
        result = await session.execute(stmt)
        row = result.one_or_none()
        if row is None:
            return None
        room, creator_display_name = row
        return self._build_response(room, creator_display_name)

    async def list_by_creator(
        self,
        session: AsyncSession,
        creator_id: uuid.UUID,
    ) -> list[RoomResponse]:
        """Return all rooms created by a user."""
        stmt = (
            select(Room, User.display_name)
            .join(User, Room.creator_id == User.id)
            .where(Room.creator_id == creator_id)
            .order_by(Room.created_at.desc())
        )
        result = await session.execute(stmt)
        return [
            self._build_response(room, display_name)
            for room, display_name in result.all()
        ]

    async def update(
        self,
        session: AsyncSession,
        code: str,
        creator_id: uuid.UUID,
        is_active: bool,
    ) -> Optional[RoomResponse]:
        """Update a room's is_active status. Creator only.

        Returns updated RoomResponse, or None if room not found.
        Raises PermissionError if caller is not the creator.
        """
        stmt = (
            select(Room, User.display_name)
            .join(User, Room.creator_id == User.id)
            .where(Room.code == code)
        )
        result = await session.execute(stmt)
        row = result.one_or_none()
        if row is None:
            return None

        room, creator_display_name = row

        if room.creator_id != creator_id:
            raise PermissionError("Only the room creator can modify this room")

        room.is_active = is_active
        await session.flush()
        logger.info("Room updated: code=%s, is_active=%s", code, is_active)
        return self._build_response(room, creator_display_name)


room_service = RoomService()

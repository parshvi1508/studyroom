"""ActivityLog ORM model mapping to the activity_log table."""

import uuid
from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy import DateTime, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ActivityLog(Base):
    """Append-only event log for room activity dashboard."""

    __tablename__ = "activity_log"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )
    room_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("rooms.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
    )
    event_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )
    event_metadata: Mapped[Optional[Any]] = mapped_column(
        "metadata",
        JSONB,
        nullable=True,
    )
    occurred_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    __table_args__ = (
        Index("idx_activity_room", "room_id", "occurred_at"),
    )

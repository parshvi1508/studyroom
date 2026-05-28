"""Pydantic response schemas for the user dashboard endpoint."""

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class SessionHistoryItem(BaseModel):
    """A single ended session in the user's history."""

    session_id: uuid.UUID
    room_name: str
    room_code: str
    start_time: datetime
    end_time: Optional[datetime]
    duration_seconds: Optional[int]


class DashboardResponse(BaseModel):
    """Aggregated dashboard data for the current user."""

    total_study_seconds: int
    session_count: int
    rooms_created: int
    session_history: list[SessionHistoryItem]

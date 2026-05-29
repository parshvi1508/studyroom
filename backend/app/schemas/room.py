"""Pydantic request and response schemas for room endpoints."""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class CreateRoomRequest(BaseModel):
    """Schema for POST /rooms/ request body."""

    name: str = Field(min_length=1, max_length=100)


class UpdateRoomRequest(BaseModel):
    """Schema for PATCH /rooms/{code} request body."""

    is_active: bool


class RoomResponse(BaseModel):
    """Schema for room endpoint responses."""

    id: uuid.UUID
    name: str
    code: str
    creator_id: uuid.UUID
    creator_display_name: str
    created_at: datetime
    is_active: bool


class MessageResponse(BaseModel):
    """Schema for GET /rooms/{code}/messages response items."""

    id: uuid.UUID
    user_id: uuid.UUID
    display_name: str
    content: str
    sent_at: datetime


class ActiveSessionResponse(BaseModel):
    """Schema for GET /rooms/{code}/session/active response."""

    session_id: uuid.UUID
    started_by: uuid.UUID
    start_time: datetime


class ActivityLogResponse(BaseModel):
    """Schema for GET /rooms/{code}/activity response items."""

    id: uuid.UUID
    user_id: uuid.UUID | None
    event_type: str
    event_metadata: dict | None
    occurred_at: datetime

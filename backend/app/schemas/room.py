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

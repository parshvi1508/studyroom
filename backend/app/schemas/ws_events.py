"""Pydantic models for all WebSocket messages per ADR-007 and WS_PROTOCOL.md."""

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


# -- Base --

class BaseEvent(BaseModel):
    """Base class for all WebSocket events. Every event has a type field."""

    type: str


# -- Client to Server --

class ChatMessageRequest(BaseModel):
    """Client sends a chat message."""

    type: str = "chat_message"
    content: str = Field(max_length=1000)


class StartSessionRequest(BaseModel):
    """Client requests to start a session. Creator only."""

    type: str = "start_session"


class EndSessionRequest(BaseModel):
    """Client requests to end a session. Creator only."""

    type: str = "end_session"


class PongRequest(BaseModel):
    """Client responds to server ping."""

    type: str = "pong"


# -- Server to Client --

class UserJoinedEvent(BaseEvent):
    """Broadcast when a user joins a room."""

    type: str = "user_joined"
    user_id: uuid.UUID
    display_name: str
    participants: list[dict]


class UserLeftEvent(BaseEvent):
    """Broadcast when a user leaves a room."""

    type: str = "user_left"
    user_id: uuid.UUID
    display_name: str
    participants: list[dict]


class ChatMessageEvent(BaseEvent):
    """Broadcast when a chat message is sent."""

    type: str = "chat_message"
    message_id: uuid.UUID
    user_id: uuid.UUID
    display_name: str
    content: str
    sent_at: datetime


class SessionStartedEvent(BaseEvent):
    """Broadcast when a study session starts."""

    type: str = "session_started"
    session_id: uuid.UUID
    started_by: uuid.UUID
    start_time: datetime


class SessionEndedEvent(BaseEvent):
    """Broadcast when a study session ends."""

    type: str = "session_ended"
    session_id: uuid.UUID
    end_time: datetime
    duration_seconds: int


class ErrorEvent(BaseEvent):
    """Sent to a single client on validation or permission errors."""

    type: str = "error"
    code: str
    message: str


class PingEvent(BaseEvent):
    """Server ping to keep connection alive (every 30s for Azure)."""

    type: str = "ping"

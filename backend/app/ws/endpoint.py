"""WebSocket endpoint handler.

Thin orchestrator: validates auth and room, delegates to services
for DB operations and to ConnectionManager for message delivery.
"""

import json
import logging
import uuid

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from jose import JWTError
from sqlalchemy import select

from app.core.database import async_session_factory
from app.core.security import decode_access_token
from app.models.room import Room
from app.models.user import User
from app.schemas.ws_events import (
    ChatMessageEvent,
    ErrorEvent,
    SessionEndedEvent,
    SessionStartedEvent,
    UserJoinedEvent,
    UserLeftEvent,
)
from app.services.message_service import message_service
from app.services.session_service import session_service
from app.ws.manager import manager

logger = logging.getLogger(__name__)

router = APIRouter()


async def _authenticate(token: str) -> tuple[uuid.UUID, str] | None:
    """Validate JWT and return (user_id, display_name) or None."""
    try:
        payload = decode_access_token(token)
        user_id_str = payload.get("sub")
        if user_id_str is None:
            return None
        user_id = uuid.UUID(user_id_str)
    except (JWTError, ValueError):
        return None

    async with async_session_factory() as session:
        user = await session.get(User, user_id)
        if user is None:
            return None
        return user_id, user.display_name


async def _get_room(code: str) -> Room | None:
    """Fetch room by code. Returns None if not found."""
    async with async_session_factory() as session:
        stmt = select(Room).where(Room.code == code)
        result = await session.execute(stmt)
        return result.scalar_one_or_none()


@router.websocket("/ws/{room_code}")
async def websocket_endpoint(
    websocket: WebSocket,
    room_code: str,
    token: str = Query(...),
) -> None:
    """WebSocket endpoint for real-time room communication.

    Validates JWT from query param (ADR-005), checks room exists and
    is active, then enters the receive loop.
    """
    # -- Auth --
    auth_result = await _authenticate(token)
    if auth_result is None:
        logger.warning("WS rejected: invalid token for room=%s", room_code)
        await websocket.close(code=4001, reason="Invalid or expired token")
        return
    user_id, display_name = auth_result
    user_id_str = str(user_id)

    # -- Room validation --
    room = await _get_room(room_code)
    if room is None:
        logger.warning("WS rejected: room not found, code=%s, user=%s", room_code, user_id_str)
        await websocket.close(code=4004, reason="Room not found")
        return
    if not room.is_active:
        logger.warning("WS rejected: room archived, code=%s, user=%s", room_code, user_id_str)
        await websocket.close(code=4003, reason="Room is archived")
        return

    # -- Duplicate connection check (Option A: reject) --
    if manager.is_connected(room_code, user_id_str):
        logger.warning("WS rejected: duplicate connection, room=%s, user=%s", room_code, user_id_str)
        await websocket.close(code=4009, reason="Already connected from another client")
        return

    # -- Connect --
    await manager.connect(room_code, user_id_str, display_name, websocket)

    # -- Log join + broadcast --
    async with async_session_factory() as db:
        await session_service.log_user_joined(db, room.id, user_id)
        await db.commit()

    await manager.broadcast_to_room(
        room_code,
        UserJoinedEvent(
            user_id=user_id,
            display_name=display_name,
            participants=manager.get_participant_details(room_code),
        ),
    )

    # -- Receive loop --
    cleanup_done = False
    try:
        while True:
            raw = await websocket.receive_text()
            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                await manager.send_to_user(
                    room_code,
                    user_id_str,
                    ErrorEvent(code="INVALID_JSON", message="Message is not valid JSON"),
                )
                continue

            msg_type = data.get("type")

            if msg_type == "chat_message":
                content = data.get("content", "")
                if not content or len(content) > 1000:
                    await manager.send_to_user(
                        room_code,
                        user_id_str,
                        ErrorEvent(
                            code="INVALID_CONTENT",
                            message="Content must be 1-1000 characters",
                        ),
                    )
                    continue

                async with async_session_factory() as db:
                    msg = await message_service.save(db, room.id, user_id, content)
                    await db.commit()

                await manager.broadcast_to_room(
                    room_code,
                    ChatMessageEvent(
                        message_id=msg.id,
                        user_id=user_id,
                        display_name=display_name,
                        content=msg.content,
                        sent_at=msg.sent_at,
                    ),
                )

            elif msg_type == "start_session":
                if room.creator_id != user_id:
                    await manager.send_to_user(
                        room_code,
                        user_id_str,
                        ErrorEvent(
                            code="NOT_ROOM_CREATOR",
                            message="Only the room creator can start a session",
                        ),
                    )
                    continue

                try:
                    async with async_session_factory() as db:
                        new_session = await session_service.start(db, room.id, user_id)
                        await db.commit()
                except ValueError as exc:
                    await manager.send_to_user(
                        room_code,
                        user_id_str,
                        ErrorEvent(code="SESSION_ALREADY_ACTIVE", message=str(exc)),
                    )
                    continue

                await manager.broadcast_to_room(
                    room_code,
                    SessionStartedEvent(
                        session_id=new_session.id,
                        started_by=user_id,
                        start_time=new_session.start_time,
                    ),
                )

            elif msg_type == "end_session":
                if room.creator_id != user_id:
                    await manager.send_to_user(
                        room_code,
                        user_id_str,
                        ErrorEvent(
                            code="NOT_ROOM_CREATOR",
                            message="Only the room creator can end a session",
                        ),
                    )
                    continue

                try:
                    async with async_session_factory() as db:
                        ended = await session_service.end(db, room.id, user_id)
                        await db.commit()
                except ValueError as exc:
                    await manager.send_to_user(
                        room_code,
                        user_id_str,
                        ErrorEvent(code="NO_ACTIVE_SESSION", message=str(exc)),
                    )
                    continue

                await manager.broadcast_to_room(
                    room_code,
                    SessionEndedEvent(
                        session_id=ended.id,
                        end_time=ended.end_time,
                        duration_seconds=ended.duration_seconds,
                    ),
                )

            elif msg_type == "pong":
                pass

            else:
                await manager.send_to_user(
                    room_code,
                    user_id_str,
                    ErrorEvent(
                        code="UNKNOWN_MESSAGE_TYPE",
                        message="Unknown message type: %s" % msg_type,
                    ),
                )

    except WebSocketDisconnect:
        pass
    except Exception:
        logger.exception("WS error: room=%s, user=%s", room_code, user_id_str)
    finally:
        # Guard against double cleanup (ping task may also trigger disconnect)
        if cleanup_done:
            return
        cleanup_done = True

        await manager.disconnect(room_code, user_id_str)

        async with async_session_factory() as db:
            await session_service.log_user_left(db, room.id, user_id)
            await db.commit()

        await manager.broadcast_to_room(
            room_code,
            UserLeftEvent(
                user_id=user_id,
                display_name=display_name,
                participants=manager.get_participant_details(room_code),
            ),
        )

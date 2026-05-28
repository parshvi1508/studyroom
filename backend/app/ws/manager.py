"""In-memory WebSocket connection manager per ADR-003.

Knows nothing about the database. Only tracks who is connected where
and relays messages. Swapping to Redis requires changes only inside
this class.
"""

import asyncio
import logging

from fastapi import WebSocket
from starlette.websockets import WebSocketState

from app.schemas.ws_events import BaseEvent, PingEvent

logger = logging.getLogger(__name__)

PING_INTERVAL_SECONDS = 30


class ConnectionManager:
    """Manages WebSocket connections grouped by room code.

    Provides connect, disconnect, broadcast, and participant listing.
    Runs a per-connection ping loop to keep Azure connections alive (ADR-011).
    """

    def __init__(self) -> None:
        """Initialise empty connection and ping task stores."""
        self._rooms: dict[str, dict[str, WebSocket]] = {}
        self._ping_tasks: dict[str, dict[str, asyncio.Task]] = {}
        self._display_names: dict[str, dict[str, str]] = {}

    def is_connected(self, room_code: str, user_id: str) -> bool:
        """Check if a user is already connected to a room."""
        return user_id in self._rooms.get(room_code, {})

    async def connect(
        self,
        room_code: str,
        user_id: str,
        display_name: str,
        websocket: WebSocket,
    ) -> None:
        """Accept a WebSocket connection and add it to a room.

        Starts a per-connection ping task for keep-alive.
        """
        await websocket.accept()

        if room_code not in self._rooms:
            self._rooms[room_code] = {}
            self._ping_tasks[room_code] = {}
            self._display_names[room_code] = {}

        self._rooms[room_code][user_id] = websocket
        self._display_names[room_code][user_id] = display_name
        self._ping_tasks[room_code][user_id] = asyncio.create_task(
            self._ping_loop(room_code, user_id, websocket)
        )

        logger.info(
            "WS connected: room=%s, user=%s (%s)",
            room_code,
            user_id,
            display_name,
        )

    async def disconnect(self, room_code: str, user_id: str) -> None:
        """Remove a user's connection from a room and cancel their ping task."""
        if room_code in self._ping_tasks and user_id in self._ping_tasks[room_code]:
            self._ping_tasks[room_code][user_id].cancel()
            del self._ping_tasks[room_code][user_id]

        if room_code in self._display_names and user_id in self._display_names[room_code]:
            del self._display_names[room_code][user_id]

        if room_code in self._rooms and user_id in self._rooms[room_code]:
            del self._rooms[room_code][user_id]
            if not self._rooms[room_code]:
                del self._rooms[room_code]
                if room_code in self._ping_tasks:
                    del self._ping_tasks[room_code]
                if room_code in self._display_names:
                    del self._display_names[room_code]

        logger.info("WS disconnected: room=%s, user=%s", room_code, user_id)

    async def broadcast_to_room(self, room_code: str, event: BaseEvent) -> None:
        """Send a Pydantic event to all connected clients in a room."""
        if room_code not in self._rooms:
            return

        payload = event.model_dump_json()
        stale_users: list[str] = []

        for uid, ws in self._rooms[room_code].items():
            try:
                if ws.client_state == WebSocketState.CONNECTED:
                    await ws.send_text(payload)
            except Exception:
                stale_users.append(uid)

        for uid in stale_users:
            await self.disconnect(room_code, uid)

    async def send_to_user(
        self,
        room_code: str,
        user_id: str,
        event: BaseEvent,
    ) -> None:
        """Send a Pydantic event to a specific user in a room."""
        ws = self._rooms.get(room_code, {}).get(user_id)
        if ws is None:
            return
        try:
            if ws.client_state == WebSocketState.CONNECTED:
                await ws.send_text(event.model_dump_json())
        except Exception:
            await self.disconnect(room_code, user_id)

    def get_participants(self, room_code: str) -> list[str]:
        """Return list of user IDs currently connected to a room."""
        return list(self._rooms.get(room_code, {}).keys())

    def get_participant_details(self, room_code: str) -> list[dict]:
        """Return list of {user_id, display_name} for all connected users."""
        names = self._display_names.get(room_code, {})
        return [
            {"user_id": uid, "display_name": names.get(uid, "Unknown")}
            for uid in self._rooms.get(room_code, {})
        ]

    async def _ping_loop(
        self,
        room_code: str,
        user_id: str,
        websocket: WebSocket,
    ) -> None:
        """Send periodic pings to keep the connection alive on Azure (ADR-011)."""
        ping_event = PingEvent()
        try:
            while True:
                await asyncio.sleep(PING_INTERVAL_SECONDS)
                if websocket.client_state == WebSocketState.CONNECTED:
                    await websocket.send_text(ping_event.model_dump_json())
                else:
                    break
        except asyncio.CancelledError:
            pass
        except Exception:
            logger.warning(
                "Ping failed, disconnecting: room=%s, user=%s",
                room_code,
                user_id,
            )
            await self.disconnect(room_code, user_id)


manager = ConnectionManager()

"""Room routes for creation, retrieval, listing, and deactivation."""

import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.routes.auth import get_current_user_id
from app.schemas.room import CreateRoomRequest, RoomResponse, UpdateRoomRequest
from app.services.room_service import room_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/rooms", tags=["rooms"])


@router.post("/", response_model=RoomResponse, status_code=status.HTTP_201_CREATED)
async def create_room(
    body: CreateRoomRequest,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> RoomResponse:
    """Create a new study room and return it with a generated room code."""
    try:
        return await room_service.create(
            session=db,
            name=body.name,
            creator_id=user_id,
        )
    except RuntimeError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not generate unique room code. Try again.",
        )


@router.get("/", response_model=list[RoomResponse])
async def list_rooms(
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> list[RoomResponse]:
    """List all rooms created by the current user."""
    return await room_service.list_by_creator(session=db, creator_id=user_id)


@router.get("/{code}", response_model=RoomResponse)
async def get_room(
    code: str,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> RoomResponse:
    """Get a room by its 6-character code."""
    room = await room_service.get_by_code(session=db, code=code)
    if room is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found",
        )
    return room


@router.patch("/{code}", response_model=RoomResponse)
async def update_room(
    code: str,
    body: UpdateRoomRequest,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> RoomResponse:
    """Update a room's status. Creator only."""
    try:
        result = await room_service.update(
            session=db,
            code=code,
            creator_id=user_id,
            is_active=body.is_active,
        )
    except PermissionError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found",
        )
    return result

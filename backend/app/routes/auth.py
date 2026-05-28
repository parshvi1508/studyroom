"""Authentication routes for register, login, and current user retrieval."""

import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import decode_access_token
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from app.services.user_service import user_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])
security_scheme = HTTPBearer()


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
) -> uuid.UUID:
    """Extract and validate user ID from JWT bearer token.

    Returns the user UUID from the token's 'sub' claim.
    Raises HTTP 401 if token is missing, expired, or malformed.
    """
    try:
        payload = decode_access_token(credentials.credentials)
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token missing subject claim",
            )
        return uuid.UUID(user_id_str)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    """Register a new user and return an access token."""
    try:
        _user, token = await user_service.register(
            session=db,
            email=body.email,
            password=body.password,
            display_name=body.display_name,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        )
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    """Authenticate a user and return an access token."""
    try:
        _user, token = await user_service.authenticate(
            session=db,
            email=body.email,
            password=body.password,
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserResponse)
async def me(
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """Return the currently authenticated user's profile."""
    user = await user_service.get_by_id(db, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return UserResponse.model_validate(user)

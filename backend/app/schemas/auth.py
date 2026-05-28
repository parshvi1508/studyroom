"""Pydantic request and response schemas for authentication endpoints."""

import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    """Schema for POST /auth/register request body."""

    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    display_name: str = Field(min_length=1, max_length=100)


class LoginRequest(BaseModel):
    """Schema for POST /auth/login request body."""

    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Schema for POST /auth/login and /auth/register response body."""

    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    """Schema for GET /auth/me response body."""

    id: uuid.UUID
    email: str
    display_name: str
    created_at: datetime

    model_config = {"from_attributes": True}

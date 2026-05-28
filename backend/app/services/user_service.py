"""Business logic for user registration, authentication, and retrieval."""

import logging
import uuid
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User

logger = logging.getLogger(__name__)


class UserService:
    """Handles user-related business logic with database interactions.

    Each method receives an AsyncSession from the route layer via
    dependency injection. This class does not manage sessions or commits.
    """

    async def get_by_email(self, session: AsyncSession, email: str) -> Optional[User]:
        """Return a user by email, or None if not found."""
        stmt = select(User).where(User.email == email)
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_id(self, session: AsyncSession, user_id: uuid.UUID) -> Optional[User]:
        """Return a user by primary key, or None if not found."""
        stmt = select(User).where(User.id == user_id)
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    async def register(
        self,
        session: AsyncSession,
        email: str,
        password: str,
        display_name: str,
    ) -> tuple[User, str]:
        """Register a new user and return the user object with an access token.

        Raises ValueError if email already exists.
        """
        existing = await self.get_by_email(session, email)
        if existing is not None:
            raise ValueError("Email already registered")

        user = User(
            email=email,
            hashed_password=hash_password(password),
            display_name=display_name,
        )
        session.add(user)
        await session.flush()

        token = create_access_token({"sub": str(user.id)})
        logger.info("User registered: %s", user.email)
        return user, token

    async def authenticate(
        self,
        session: AsyncSession,
        email: str,
        password: str,
    ) -> tuple[User, str]:
        """Authenticate a user by email and password.

        Returns the user object and an access token.
        Raises ValueError if credentials are invalid.
        """
        user = await self.get_by_email(session, email)
        if user is None or not verify_password(password, user.hashed_password):
            raise ValueError("Invalid email or password")

        token = create_access_token({"sub": str(user.id)})
        logger.info("User authenticated: %s", user.email)
        return user, token


user_service = UserService()

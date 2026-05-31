import secrets
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password, verify_password
from app.models.user import PasswordResetToken, User
from app.schemas.auth import SignupRequest

RESET_TOKEN_TTL = timedelta(hours=1)


class AuthError(Exception):
    """Base class for auth domain errors."""


class EmailAlreadyExistsError(AuthError):
    pass


class InvalidCredentialsError(AuthError):
    pass


class InvalidResetTokenError(AuthError):
    pass


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_user_by_id(db: AsyncSession, user_id: uuid.UUID) -> User | None:
    return await db.get(User, user_id)


async def signup(db: AsyncSession, data: SignupRequest) -> User:
    existing = await get_user_by_email(db, data.email)
    if existing is not None:
        raise EmailAlreadyExistsError("Email already registered")

    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        name=data.name,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def update_profile(
    db: AsyncSession,
    user: User,
    name: str | None = None,
    email: str | None = None,
) -> User:
    """Update the caller's own name and/or email.

    Email is the unique login handle, so a change to a different address is
    rejected if it's already taken (409 at the router).
    """
    if email is not None and email != user.email:
        existing = await get_user_by_email(db, email)
        if existing is not None:
            raise EmailAlreadyExistsError("Email already registered")
        user.email = email
    if name is not None:
        user.name = name
    await db.commit()
    await db.refresh(user)
    return user


async def authenticate(db: AsyncSession, email: str, password: str) -> User:
    user = await get_user_by_email(db, email)
    if user is None or not verify_password(password, user.hashed_password):
        raise InvalidCredentialsError("Incorrect email or password")
    return user


async def request_password_reset(db: AsyncSession, email: str) -> str | None:
    """Anti-enumeration: always succeed outwardly. Only act if the user exists.

    Returns the reset token if a user exists (so the router can schedule the
    email), or None otherwise. The router still returns 200 either way.
    """
    user = await get_user_by_email(db, email)
    if user is None:
        return None

    token = secrets.token_urlsafe(32)
    reset = PasswordResetToken(
        user_id=user.id,
        token=token,
        expires_at=datetime.now(timezone.utc) + RESET_TOKEN_TTL,
        used=False,
    )
    db.add(reset)
    await db.commit()
    return token


async def confirm_password_reset(
    db: AsyncSession, token: str, new_password: str
) -> None:
    result = await db.execute(
        select(PasswordResetToken).where(PasswordResetToken.token == token)
    )
    reset = result.scalar_one_or_none()

    now = datetime.now(timezone.utc)
    if reset is None or reset.used or reset.expires_at <= now:
        raise InvalidResetTokenError("Invalid or expired token")

    user = await get_user_by_id(db, reset.user_id)
    if user is None:
        raise InvalidResetTokenError("Invalid or expired token")

    user.hashed_password = hash_password(new_password)
    reset.used = True

    # Invalidate every other outstanding token for this user.
    await db.execute(
        update(PasswordResetToken)
        .where(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.id != reset.id,
            PasswordResetToken.used.is_(False),
        )
        .values(used=True)
    )
    await db.commit()

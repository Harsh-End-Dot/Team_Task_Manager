from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.core.rate_limit import limiter, password_reset_limit
from app.models.user import User
from app.notifications import notifications
from app.schemas.auth import (
    LoginRequest,
    MessageResponse,
    PasswordResetConfirm,
    PasswordResetRequest,
    ProfileUpdate,
    SignupRequest,
    TokenResponse,
    UserResponse,
)
from app.services import auth_service
from app.services.auth_service import (
    EmailAlreadyExistsError,
    InvalidCredentialsError,
    InvalidResetTokenError,
)
from app.core.security import create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def signup(data: SignupRequest, db: AsyncSession = Depends(get_db)) -> User:
    try:
        return await auth_service.signup(db, data)
    except EmailAlreadyExistsError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    try:
        user = await auth_service.authenticate(db, data.email, data.password)
    except InvalidCredentialsError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    access_token = create_access_token(subject=user.id)
    return TokenResponse(access_token=access_token)


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@router.patch("/me", response_model=UserResponse)
async def update_me(
    data: ProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> User:
    try:
        return await auth_service.update_profile(
            db, current_user, name=data.name, email=data.email
        )
    except EmailAlreadyExistsError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )


@router.post("/password-reset/request", response_model=MessageResponse)
# Per-IP limit — also hits the external email API (shares the quota). The
# endpoint is public, so `request: Request` is keyed by client IP. Login is
# intentionally NOT rate limited.
@limiter.limit(password_reset_limit)
async def password_reset_request(
    request: Request,
    data: PasswordResetRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    token = await auth_service.request_password_reset(db, data.email)
    if token is not None:
        notifications.send_password_reset_email(
            background_tasks, to=data.email, token=token
        )
    return MessageResponse(
        message="If an account with that email exists, a reset link has been sent."
    )


@router.post("/password-reset/confirm", response_model=MessageResponse)
async def password_reset_confirm(
    data: PasswordResetConfirm, db: AsyncSession = Depends(get_db)
) -> MessageResponse:
    try:
        await auth_service.confirm_password_reset(db, data.token, data.new_password)
    except InvalidResetTokenError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired token",
        )
    return MessageResponse(message="Password has been reset.")

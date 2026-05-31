"""Rate limiting (slowapi) for the email-sending endpoints.

We throttle only the endpoints that call the external email API (limited free
quota): invitation creation and password-reset requests. The login endpoint is
deliberately left untouched.

STORAGE IS IN-MEMORY (slowapi's default) — correct for a single instance /
single process. If this service is scaled horizontally (multiple Uvicorn
workers or containers), the per-process counters won't add up to a global
limit; point slowapi at a shared backend instead, e.g.:

    Limiter(..., storage_uri="redis://<host>:6379")

so the window is enforced across every instance.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.core.config import settings
from app.core.security import decode_access_token


def user_or_ip_key(request: Request) -> str:
    """Limit key: the authenticated user id when present, else the client IP.

    Invitation creation is authenticated, so we decode the bearer token and key
    the limit per-user (so a shared office/NAT IP doesn't make one user's quota
    exhaust everyone's). Public endpoints (password reset) have no token and
    fall back to the remote address.
    """
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        payload = decode_access_token(auth[len("Bearer ") :])
        if payload and payload.get("sub"):
            return f"user:{payload['sub']}"
    return get_remote_address(request)


# Tunable limit values, read from settings at request time (callable form) so
# they can be changed via env without touching code. Tolerant signatures because
# slowapi may call the provider with or without the request.
def invitation_limit(*_args, **_kwargs) -> str:
    return settings.RATE_LIMIT_INVITATION


def password_reset_limit(*_args, **_kwargs) -> str:
    return settings.RATE_LIMIT_PASSWORD_RESET


limiter = Limiter(
    key_func=user_or_ip_key,
    enabled=settings.RATE_LIMIT_ENABLED,
    # headers_enabled is intentionally OFF: with it on, slowapi tries to inject
    # X-RateLimit-* headers into the endpoint's return value, but our endpoints
    # return Pydantic models (not Starlette Response objects), which makes
    # slowapi raise. The 429 enforcement does not depend on these headers.
    headers_enabled=False,
)


def rate_limit_exceeded_handler(request: Request, exc: Exception) -> JSONResponse:
    """Return a clean 429 with a clear message when a limit is exceeded."""
    return JSONResponse(
        status_code=429,
        content={
            "detail": (
                "Rate limit exceeded. You're sending requests too quickly — "
                "please wait a moment and try again."
            )
        },
    )

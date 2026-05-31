from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment / .env."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/task_manager"

    @field_validator("DATABASE_URL")
    @classmethod
    def _force_asyncpg_driver(cls, value: str) -> str:
        """Normalize the driver so a managed Postgres URL works as-is.

        Railway/Heroku hand out `postgres://` or `postgresql://` URLs, but our
        async engine needs the asyncpg driver. Rewrite the bare schemes; leave
        an explicit `postgresql+<driver>://` untouched.
        """
        if value.startswith("postgres://"):
            return "postgresql+asyncpg://" + value[len("postgres://"):]
        if value.startswith("postgresql://"):
            return "postgresql+asyncpg://" + value[len("postgresql://"):]
        return value

    # JWT / auth
    JWT_SECRET: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Email (Phase 11). If EMAIL_API_KEY is empty, emails are logged, not sent.
    EMAIL_PROVIDER: str = "resend"  # "resend" or "sendgrid"
    EMAIL_API_KEY: str = ""
    EMAIL_FROM: str = "no-reply@example.com"
    FRONTEND_URL: str = "http://localhost:3000"

    # --- Rate limiting (slowapi) ---
    # Protects the endpoints that hit the external email API (limited free quota)
    # from abuse on a public deployment. Tune the windows via env without code
    # changes; set RATE_LIMIT_ENABLED=false to turn limiting off (the test suite
    # does this so pytest isn't throttled).
    #
    # Storage is IN-MEMORY (slowapi default) — correct for a single instance /
    # single process. If scaled horizontally (multiple workers/containers),
    # switch to a shared Redis backend (see app/core/rate_limit.py) so limits are
    # enforced globally rather than per-process.
    RATE_LIMIT_ENABLED: bool = True
    # Invitations send email — tightest limit, keyed per authenticated user.
    RATE_LIMIT_INVITATION: str = "5/minute;20/hour"
    # Password reset also sends email — keyed per client IP (endpoint is public).
    RATE_LIMIT_PASSWORD_RESET: str = "3/hour"
    # Business cap (independent of the time-window limits): the max number of
    # pending (unaccepted, unexpired) invitations a single workspace may hold.
    MAX_PENDING_INVITATIONS_PER_WORKSPACE: int = 20


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

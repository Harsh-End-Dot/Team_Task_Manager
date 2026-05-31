import os

# Disable rate limiting for the whole test suite so pytest isn't throttled.
# MUST run before any `app.*` import so Settings (and the slowapi Limiter, which
# reads RATE_LIMIT_ENABLED at construction) pick it up.
os.environ["RATE_LIMIT_ENABLED"] = "false"

import asyncpg
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

import app.models  # noqa: F401  (register all models on Base.metadata)
from app.core.config import settings
from app.core.database import Base, get_db
from app.main import app

# A dedicated test database alongside the dev one. NEVER the dev DB.
_BASE_URL = make_url(settings.DATABASE_URL)
TEST_URL = _BASE_URL.set(database=f"{_BASE_URL.database}_test")
# str(URL) masks the password as '***'; render the real one for the engine.
TEST_URL_STR = TEST_URL.render_as_string(hide_password=False)

# Every engine uses NullPool so each operation opens a fresh connection on the
# current event loop â€” pytest-asyncio gives each test its own loop, and pooled
# asyncpg connections can't be shared across loops.
_schema_ready = False


async def _ensure_schema() -> None:
    """Drop + recreate the test DB and its schema, once per test session."""
    global _schema_ready
    if _schema_ready:
        return
    admin = await asyncpg.connect(
        host=_BASE_URL.host, port=_BASE_URL.port or 5432,
        user=_BASE_URL.username, password=_BASE_URL.password, database="postgres",
    )
    try:
        await admin.execute(f'DROP DATABASE IF EXISTS "{TEST_URL.database}"')
        await admin.execute(f'CREATE DATABASE "{TEST_URL.database}"')
    finally:
        await admin.close()

    engine = create_async_engine(TEST_URL_STR, poolclass=NullPool)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await engine.dispose()
    _schema_ready = True


async def _truncate_all() -> None:
    engine = create_async_engine(TEST_URL_STR, poolclass=NullPool)
    names = ", ".join(f'"{t.name}"' for t in Base.metadata.sorted_tables)
    async with engine.begin() as conn:
        await conn.execute(text(f"TRUNCATE {names} RESTART IDENTITY CASCADE"))
    await engine.dispose()


@pytest_asyncio.fixture
async def client():
    await _ensure_schema()
    await _truncate_all()

    engine = create_async_engine(TEST_URL_STR, poolclass=NullPool)
    test_session = async_sessionmaker(engine, expire_on_commit=False)

    async def _override_get_db():
        async with test_session() as session:
            yield session

    app.dependency_overrides[get_db] = _override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session():
    """A raw session for tests that need to seed rows directly (e.g. memberships)."""
    await _ensure_schema()
    engine = create_async_engine(TEST_URL_STR, poolclass=NullPool)
    test_session = async_sessionmaker(engine, expire_on_commit=False)
    async with test_session() as session:
        yield session
    await engine.dispose()

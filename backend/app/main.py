from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.core.rate_limit import limiter, rate_limit_exceeded_handler
from app.routers import (
    activity,
    auth,
    comments,
    dashboard,
    invitations,
    labels,
    projects,
    realtime,
    search,
    tasks,
    workspaces,
)

app = FastAPI(
    title="Team Task Manager API",
    version="0.1.0",
    description="Multi-tenant team task manager backend.",
)

# Rate limiting (slowapi). Only the email-sending endpoints carry @limiter.limit
# decorators (see invitations/auth routers); everything else is unaffected.
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# CORS — allow all in development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch-all so unexpected errors return JSON instead of a bare 500.

    Domain-specific handlers are added as services introduce typed exceptions.
    """
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


@app.get("/health", tags=["health"])
async def health() -> dict[str, str]:
    return {"status": "ok"}


# --- Router registration ---
app.include_router(auth.router)
app.include_router(workspaces.router)
app.include_router(invitations.router)
app.include_router(projects.router)
app.include_router(tasks.router)
app.include_router(labels.router)
app.include_router(comments.router)
app.include_router(activity.router)
app.include_router(dashboard.router)
app.include_router(search.router)
app.include_router(realtime.router)
# Later phases: notifications, seed/tests/docker, ...

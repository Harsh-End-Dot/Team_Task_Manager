import json
import logging
import uuid

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.database import async_session_maker
from app.core.security import decode_access_token
from app.models.user import User
from app.realtime.manager import manager
from app.services import workspace_service

logger = logging.getLogger(__name__)

router = APIRouter()

# Application-defined WS close codes (4000-4999 are private use).
WS_UNAUTHORIZED = 4401
WS_FORBIDDEN = 4403


def _token_from_message(raw: str) -> str | None:
    """Accept either a raw token string or a JSON {"token": "..."} first frame."""
    try:
        parsed = json.loads(raw)
    except (json.JSONDecodeError, TypeError):
        return raw.strip() or None
    if isinstance(parsed, dict):
        return parsed.get("token")
    return None


async def _authenticate(token: str | None, workspace_id: uuid.UUID) -> User | None:
    """Return the user iff the token is valid AND they're a member of the workspace."""
    if not token:
        return None
    payload = decode_access_token(token)
    if payload is None or payload.get("sub") is None:
        return None
    try:
        user_id = uuid.UUID(str(payload["sub"]))
    except ValueError:
        return None
    async with async_session_maker() as db:
        user = await db.get(User, user_id)
        if user is None:
            return None
        membership = await workspace_service.get_membership(db, workspace_id, user_id)
        if membership is None:
            return None
        return user


@router.websocket("/ws/workspaces/{workspace_id}")
async def workspace_ws(websocket: WebSocket, workspace_id: uuid.UUID) -> None:
    await websocket.accept()

    # Browsers can't set Authorization headers on WS, so take the JWT from the
    # ?token= query param, or fall back to the first message.
    token = websocket.query_params.get("token")
    if token is None:
        try:
            token = _token_from_message(await websocket.receive_text())
        except WebSocketDisconnect:
            return

    user = await _authenticate(token, workspace_id)
    if user is None:
        await websocket.send_json({"type": "error", "detail": "unauthorized"})
        await websocket.close(code=WS_UNAUTHORIZED)
        return

    manager.connect(workspace_id, websocket)
    await websocket.send_json(
        {"type": "connected", "workspace_id": str(workspace_id)}
    )
    try:
        # We don't act on inbound messages yet; just keep the socket open until
        # the client disconnects.
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(workspace_id, websocket)

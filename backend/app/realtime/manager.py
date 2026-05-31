import logging
import uuid
from typing import Any

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """In-memory registry of active WebSocket connections, grouped by workspace.

    Single-process only (fine for one backend container). If the app is ever
    scaled horizontally this needs a shared backplane (e.g. Redis pub/sub).
    """

    def __init__(self) -> None:
        self._rooms: dict[uuid.UUID, set[WebSocket]] = {}

    def connect(self, workspace_id: uuid.UUID, websocket: WebSocket) -> None:
        self._rooms.setdefault(workspace_id, set()).add(websocket)

    def disconnect(self, workspace_id: uuid.UUID, websocket: WebSocket) -> None:
        room = self._rooms.get(workspace_id)
        if room is not None:
            room.discard(websocket)
            if not room:
                del self._rooms[workspace_id]

    def count(self, workspace_id: uuid.UUID) -> int:
        return len(self._rooms.get(workspace_id, ()))

    async def broadcast_to_workspace(
        self, workspace_id: uuid.UUID, message: dict[str, Any]
    ) -> None:
        # Iterate a snapshot so connect/disconnect during an await can't mutate
        # the set mid-iteration. Drop any socket that fails to receive.
        for websocket in list(self._rooms.get(workspace_id, ())):
            try:
                await websocket.send_json(message)
            except Exception:
                self.disconnect(workspace_id, websocket)


manager = ConnectionManager()


async def notify(workspace_id: uuid.UUID, event_type: str, **data: Any) -> None:
    """Best-effort broadcast of a small typed event. Never raises.

    Services call this AFTER a successful commit; a broadcast failure (or no
    connected clients) must never affect the REST response.
    """
    try:
        await manager.broadcast_to_workspace(
            workspace_id, {"type": event_type, **data}
        )
    except Exception:  # pragma: no cover - defensive; broadcast is best-effort
        logger.warning("realtime broadcast failed for %s", event_type, exc_info=True)

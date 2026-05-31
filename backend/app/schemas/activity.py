import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ActivityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    workspace_id: uuid.UUID
    actor_id: uuid.UUID | None
    verb: str
    target: str | None
    created_at: datetime

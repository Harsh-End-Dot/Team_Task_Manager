import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.auth import UserResponse


class CommentCreate(BaseModel):
    body: str = Field(min_length=1)


class CommentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    task_id: uuid.UUID
    author_id: uuid.UUID
    body: str
    created_at: datetime
    mentioned_users: list[UserResponse]

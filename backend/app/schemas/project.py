import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class ProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None
    due_date: date | None = None


class ProjectUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    due_date: date | None = None


class ProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    workspace_id: uuid.UUID
    name: str
    description: str | None
    due_date: date | None
    deleted_at: datetime | None
    created_at: datetime


class ProjectProgress(BaseModel):
    project_id: uuid.UUID
    total_tasks: int
    done_tasks: int
    percent: float

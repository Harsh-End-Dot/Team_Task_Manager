import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.task import TaskPriority, TaskStatus
from app.schemas.label import LabelResponse


class SubtaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)


class SubtaskUpdate(BaseModel):
    # None => toggle current value; explicit bool => set it.
    is_done: bool | None = None


class SubtaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    task_id: uuid.UUID
    title: str
    is_done: bool
    created_at: datetime


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    status: TaskStatus = TaskStatus.TODO
    priority: TaskPriority = TaskPriority.MEDIUM
    assignee_id: uuid.UUID | None = None
    due_date: date | None = None


class TaskUpdate(BaseModel):
    """Content edit. Status/assignee/position have dedicated endpoints."""

    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    priority: TaskPriority | None = None
    due_date: date | None = None


class TaskStatusUpdate(BaseModel):
    status: TaskStatus


class TaskAssign(BaseModel):
    assignee_id: uuid.UUID | None = None


class TaskReorder(BaseModel):
    position: int = Field(ge=0)


class TaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    project_id: uuid.UUID
    assignee_id: uuid.UUID | None
    title: str
    description: str | None
    status: TaskStatus
    priority: TaskPriority
    position: int
    due_date: date | None
    deleted_at: datetime | None
    created_at: datetime
    subtasks: list[SubtaskResponse]
    labels: list[LabelResponse]

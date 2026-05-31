import uuid
from datetime import date

from pydantic import BaseModel, ConfigDict

from app.models.task import TaskPriority, TaskStatus


class StatusCounts(BaseModel):
    TODO: int = 0
    IN_PROGRESS: int = 0
    DONE: int = 0


class TaskSummary(BaseModel):
    """Lightweight task projection for dashboard/search lists (no subtasks/labels)."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    project_id: uuid.UUID
    title: str
    status: TaskStatus
    priority: TaskPriority
    due_date: date | None
    assignee_id: uuid.UUID | None


class ProjectProgressItem(BaseModel):
    project_id: uuid.UUID
    name: str
    total_tasks: int
    done_tasks: int
    percent: float


class DashboardResponse(BaseModel):
    status_counts: StatusCounts
    overdue: list[TaskSummary]
    my_tasks: list[TaskSummary]
    project_progress: list[ProjectProgressItem]
    due_today: list[TaskSummary]
    due_this_week: list[TaskSummary]

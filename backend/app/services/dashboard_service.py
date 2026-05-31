import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Project
from app.models.task import Task, TaskStatus
from app.schemas.dashboard import (
    DashboardResponse,
    ProjectProgressItem,
    StatusCounts,
    TaskSummary,
)
from app.utils.queries import not_deleted


def _active_tasks_in_workspace(workspace_id: uuid.UUID):
    """Base select of active tasks scoped to a workspace.

    Joins Project so we can both scope by workspace_id and enforce the
    project->task soft-delete cascade (parent project must be active).
    """
    return (
        select(Task)
        .join(Project, Task.project_id == Project.id)
        .where(
            Project.workspace_id == workspace_id,
            not_deleted(Task),
            not_deleted(Project),
        )
    )


async def _summaries(db: AsyncSession, stmt) -> list[TaskSummary]:
    result = await db.execute(stmt)
    return [TaskSummary.model_validate(t) for t in result.scalars().all()]


async def get_dashboard(
    db: AsyncSession, workspace_id: uuid.UUID, user_id: uuid.UUID
) -> DashboardResponse:
    today = datetime.now(timezone.utc).date()
    week_end = today + timedelta(days=7)

    # --- status counts ---
    rows = await db.execute(
        select(Task.status, func.count(Task.id))
        .join(Project, Task.project_id == Project.id)
        .where(
            Project.workspace_id == workspace_id,
            not_deleted(Task),
            not_deleted(Project),
        )
        .group_by(Task.status)
    )
    counts = StatusCounts()
    for status_value, count in rows.all():
        setattr(counts, status_value.value, count)

    # --- task buckets (all exclude DONE; date buckets are mutually exclusive) ---
    base = _active_tasks_in_workspace(workspace_id)
    not_done = Task.status != TaskStatus.DONE

    overdue = await _summaries(
        db,
        base.where(Task.due_date.is_not(None), Task.due_date < today, not_done)
        .order_by(Task.due_date),
    )
    due_today = await _summaries(
        db, base.where(Task.due_date == today, not_done).order_by(Task.due_date)
    )
    due_this_week = await _summaries(
        db,
        base.where(Task.due_date > today, Task.due_date <= week_end, not_done)
        .order_by(Task.due_date),
    )
    my_tasks = await _summaries(
        db,
        base.where(Task.assignee_id == user_id)
        .order_by(Task.due_date.asc().nulls_last(), Task.created_at),
    )

    # --- per-project progress (one grouped query, then list every active project) ---
    progress_rows = await db.execute(
        select(
            Task.project_id,
            func.count(Task.id),
            func.count(case((Task.status == TaskStatus.DONE, Task.id))),
        )
        .join(Project, Task.project_id == Project.id)
        .where(
            Project.workspace_id == workspace_id,
            not_deleted(Task),
            not_deleted(Project),
        )
        .group_by(Task.project_id)
    )
    progress_map = {pid: (total, done) for pid, total, done in progress_rows.all()}

    projects = (
        await db.execute(
            select(Project)
            .where(Project.workspace_id == workspace_id, not_deleted(Project))
            .order_by(Project.created_at)
        )
    ).scalars().all()

    project_progress = []
    for project in projects:
        total, done = progress_map.get(project.id, (0, 0))
        percent = round(done / total * 100, 2) if total else 0.0
        project_progress.append(
            ProjectProgressItem(
                project_id=project.id,
                name=project.name,
                total_tasks=total,
                done_tasks=done,
                percent=percent,
            )
        )

    return DashboardResponse(
        status_counts=counts,
        overdue=overdue,
        my_tasks=my_tasks,
        project_progress=project_progress,
        due_today=due_today,
        due_this_week=due_this_week,
    )

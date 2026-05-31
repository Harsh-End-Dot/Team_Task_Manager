import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.label import Label
from app.models.project import Project
from app.models.task import Subtask, Task, TaskPriority, TaskStatus
from app.realtime.manager import notify
from app.schemas.task import TaskCreate, TaskUpdate
from app.services import activity_service, workspace_service
from app.utils.queries import not_deleted


class TaskError(Exception):
    """Base class for task domain errors."""


class AssigneeNotMemberError(TaskError):
    pass


async def _detail(db: AsyncSession, task_id: uuid.UUID) -> Task:
    """Reload a task with its subtasks eagerly loaded (for TaskResponse)."""
    result = await db.execute(
        select(Task)
        .where(Task.id == task_id)
        .options(selectinload(Task.subtasks), selectinload(Task.labels))
    )
    return result.scalar_one()


# --- loaders used by the auth/context dependencies (DB access via service) ---

async def get_task_with_project(
    db: AsyncSession, task_id: uuid.UUID
) -> tuple[Task, Project] | None:
    result = await db.execute(
        select(Task, Project)
        .join(Project, Task.project_id == Project.id)
        .where(Task.id == task_id)
    )
    row = result.first()
    return (row[0], row[1]) if row is not None else None


async def get_subtask_with_task_project(
    db: AsyncSession, subtask_id: uuid.UUID
) -> tuple[Subtask, Task, Project] | None:
    result = await db.execute(
        select(Subtask, Task, Project)
        .join(Task, Subtask.task_id == Task.id)
        .join(Project, Task.project_id == Project.id)
        .where(Subtask.id == subtask_id)
    )
    row = result.first()
    return (row[0], row[1], row[2]) if row is not None else None


# --- tasks ---

async def create_task(
    db: AsyncSession,
    project_id: uuid.UUID,
    workspace_id: uuid.UUID,
    actor_id: uuid.UUID,
    data: TaskCreate,
) -> Task:
    if data.assignee_id is not None:
        member = await workspace_service.get_membership(
            db, workspace_id, data.assignee_id
        )
        if member is None:
            raise AssigneeNotMemberError("Assignee is not a member of this workspace")

    # Append to the end of its status column.
    result = await db.execute(
        select(func.max(Task.position)).where(
            Task.project_id == project_id, Task.status == data.status
        )
    )
    max_pos = result.scalar()
    position = (max_pos + 1) if max_pos is not None else 0

    task = Task(
        project_id=project_id,
        assignee_id=data.assignee_id,
        title=data.title,
        description=data.description,
        status=data.status,
        priority=data.priority,
        due_date=data.due_date,
        position=position,
    )
    db.add(task)
    await db.flush()
    activity_service.record(db, workspace_id, actor_id, "task.created", task.title)
    await db.commit()
    await notify(
        workspace_id,
        "task.created",
        id=str(task.id),
        project_id=str(project_id),
        status=task.status.value,
        title=task.title,
    )
    return await _detail(db, task.id)


async def list_tasks(
    db: AsyncSession,
    project_id: uuid.UUID,
    *,
    status: TaskStatus | None = None,
    assignee_id: uuid.UUID | None = None,
    priority: TaskPriority | None = None,
    label_id: uuid.UUID | None = None,
) -> list[Task]:
    stmt = (
        select(Task)
        .where(Task.project_id == project_id, not_deleted(Task))
        .options(selectinload(Task.subtasks), selectinload(Task.labels))
        .order_by(Task.status, Task.position, Task.created_at)
    )
    if status is not None:
        stmt = stmt.where(Task.status == status)
    if assignee_id is not None:
        stmt = stmt.where(Task.assignee_id == assignee_id)
    if priority is not None:
        stmt = stmt.where(Task.priority == priority)
    if label_id is not None:
        stmt = stmt.where(Task.labels.any(Label.id == label_id))
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def list_trash(db: AsyncSession, project_id: uuid.UUID) -> list[Task]:
    result = await db.execute(
        select(Task)
        .where(Task.project_id == project_id, Task.deleted_at.is_not(None))
        .options(selectinload(Task.subtasks), selectinload(Task.labels))
        .order_by(Task.deleted_at.desc())
    )
    return list(result.scalars().all())


async def get_task_detail(db: AsyncSession, task_id: uuid.UUID) -> Task:
    return await _detail(db, task_id)


async def update_task(
    db: AsyncSession, task: Task, workspace_id: uuid.UUID, data: TaskUpdate
) -> Task:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(task, field, value)
    await db.commit()
    await notify(workspace_id, "task.updated", id=str(task.id))
    return await _detail(db, task.id)


async def change_status(
    db: AsyncSession,
    task: Task,
    workspace_id: uuid.UUID,
    actor_id: uuid.UUID,
    status: TaskStatus,
) -> Task:
    task.status = status
    activity_service.record(
        db, workspace_id, actor_id, "task.status_changed",
        f"{task.title} -> {status.value}",
    )
    await db.commit()
    await notify(
        workspace_id, "task.status_changed", id=str(task.id), status=status.value
    )
    return await _detail(db, task.id)


async def assign_task(
    db: AsyncSession,
    task: Task,
    workspace_id: uuid.UUID,
    actor_id: uuid.UUID,
    assignee_id: uuid.UUID | None,
) -> Task:
    if assignee_id is not None:
        member = await workspace_service.get_membership(db, workspace_id, assignee_id)
        if member is None:
            raise AssigneeNotMemberError("Assignee is not a member of this workspace")
    task.assignee_id = assignee_id
    activity_service.record(db, workspace_id, actor_id, "task.assigned", task.title)
    await db.commit()
    return await _detail(db, task.id)


async def reorder_task(
    db: AsyncSession, task: Task, workspace_id: uuid.UUID, position: int
) -> Task:
    task.position = position
    await db.commit()
    await notify(workspace_id, "task.moved", id=str(task.id), position=position)
    return await _detail(db, task.id)


async def soft_delete_task(
    db: AsyncSession, task: Task, workspace_id: uuid.UUID
) -> None:
    task.deleted_at = datetime.now(timezone.utc)
    await db.commit()
    await notify(workspace_id, "task.deleted", id=str(task.id))


async def restore_task(db: AsyncSession, task: Task) -> Task:
    task.deleted_at = None
    await db.commit()
    return await _detail(db, task.id)


# --- subtasks ---

async def create_subtask(db: AsyncSession, task_id: uuid.UUID, title: str) -> Subtask:
    subtask = Subtask(task_id=task_id, title=title)
    db.add(subtask)
    await db.commit()
    await db.refresh(subtask)
    return subtask


async def update_subtask(
    db: AsyncSession, subtask: Subtask, is_done: bool | None
) -> Subtask:
    subtask.is_done = (not subtask.is_done) if is_done is None else is_done
    await db.commit()
    await db.refresh(subtask)
    return subtask


async def delete_subtask(db: AsyncSession, subtask: Subtask) -> None:
    await db.delete(subtask)
    await db.commit()

import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import (
    ProjectContext,
    SubtaskContext,
    TaskContext,
    get_active_task_context,
    get_db,
    get_project_context,
    require_deleted_task_admin,
    require_project_admin,
    require_subtask_admin_or_assignee,
    require_task_admin,
    require_task_admin_or_assignee,
)
from app.models.task import Subtask, Task, TaskPriority, TaskStatus
from app.models.user import User
from app.notifications import notifications
from app.schemas.task import (
    SubtaskCreate,
    SubtaskResponse,
    SubtaskUpdate,
    TaskAssign,
    TaskCreate,
    TaskReorder,
    TaskResponse,
    TaskStatusUpdate,
    TaskUpdate,
)
from app.services import task_service
from app.services.task_service import AssigneeNotMemberError

router = APIRouter(tags=["tasks"])

_ASSIGNEE_NOT_MEMBER = HTTPException(
    status_code=status.HTTP_400_BAD_REQUEST,
    detail="Assignee is not a member of this workspace",
)


# --- project-scoped task collection ---

@router.post(
    "/projects/{project_id}/tasks",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_task(
    data: TaskCreate,
    db: AsyncSession = Depends(get_db),
    ctx: ProjectContext = Depends(require_project_admin),
) -> Task:
    try:
        return await task_service.create_task(
            db, ctx.project.id, ctx.membership.workspace_id, ctx.user.id, data
        )
    except AssigneeNotMemberError:
        raise _ASSIGNEE_NOT_MEMBER


@router.get("/projects/{project_id}/tasks", response_model=list[TaskResponse])
async def list_tasks(
    status: TaskStatus | None = None,
    assignee_id: uuid.UUID | None = None,
    priority: TaskPriority | None = None,
    label: uuid.UUID | None = None,
    db: AsyncSession = Depends(get_db),
    ctx: ProjectContext = Depends(get_project_context),
) -> list[Task]:
    return await task_service.list_tasks(
        db,
        ctx.project.id,
        status=status,
        assignee_id=assignee_id,
        priority=priority,
        label_id=label,
    )


# Declared before nothing ambiguous (single tasks live at /tasks/{id}), but kept
# explicit: admin-only listing of soft-deleted tasks in a project.
@router.get("/projects/{project_id}/tasks/trash", response_model=list[TaskResponse])
async def list_task_trash(
    db: AsyncSession = Depends(get_db),
    ctx: ProjectContext = Depends(require_project_admin),
) -> list[Task]:
    return await task_service.list_trash(db, ctx.project.id)


# --- single task ---

@router.get("/tasks/{task_id}", response_model=TaskResponse)
async def get_task(
    db: AsyncSession = Depends(get_db),
    ctx: TaskContext = Depends(get_active_task_context),
) -> Task:
    return await task_service.get_task_detail(db, ctx.task.id)


@router.patch("/tasks/{task_id}", response_model=TaskResponse)
async def update_task(
    data: TaskUpdate,
    db: AsyncSession = Depends(get_db),
    ctx: TaskContext = Depends(require_task_admin_or_assignee),
) -> Task:
    return await task_service.update_task(
        db, ctx.task, ctx.membership.workspace_id, data
    )


@router.patch("/tasks/{task_id}/status", response_model=TaskResponse)
async def update_task_status(
    data: TaskStatusUpdate,
    db: AsyncSession = Depends(get_db),
    ctx: TaskContext = Depends(require_task_admin_or_assignee),
) -> Task:
    return await task_service.change_status(
        db, ctx.task, ctx.membership.workspace_id, ctx.user.id, data.status
    )


@router.patch("/tasks/{task_id}/assign", response_model=TaskResponse)
async def assign_task(
    data: TaskAssign,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    ctx: TaskContext = Depends(require_task_admin),
) -> Task:
    try:
        task = await task_service.assign_task(
            db, ctx.task, ctx.membership.workspace_id, ctx.user.id, data.assignee_id
        )
    except AssigneeNotMemberError:
        raise _ASSIGNEE_NOT_MEMBER
    if data.assignee_id is not None:
        assignee = await db.get(User, data.assignee_id)
        if assignee is not None:
            notifications.send_assignment_email(
                background_tasks, to=assignee.email, task_title=task.title
            )
    return task


@router.patch("/tasks/{task_id}/reorder", response_model=TaskResponse)
async def reorder_task(
    data: TaskReorder,
    db: AsyncSession = Depends(get_db),
    ctx: TaskContext = Depends(require_task_admin_or_assignee),
) -> Task:
    return await task_service.reorder_task(
        db, ctx.task, ctx.membership.workspace_id, data.position
    )


@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    db: AsyncSession = Depends(get_db),
    ctx: TaskContext = Depends(require_task_admin),
) -> None:
    await task_service.soft_delete_task(db, ctx.task, ctx.membership.workspace_id)


@router.post("/tasks/{task_id}/restore", response_model=TaskResponse)
async def restore_task(
    db: AsyncSession = Depends(get_db),
    ctx: TaskContext = Depends(require_deleted_task_admin),
) -> Task:
    return await task_service.restore_task(db, ctx.task)


# --- subtasks ---

@router.post(
    "/tasks/{task_id}/subtasks",
    response_model=SubtaskResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_subtask(
    data: SubtaskCreate,
    db: AsyncSession = Depends(get_db),
    ctx: TaskContext = Depends(require_task_admin_or_assignee),
) -> Subtask:
    return await task_service.create_subtask(db, ctx.task.id, data.title)


@router.patch("/subtasks/{subtask_id}", response_model=SubtaskResponse)
async def update_subtask(
    data: SubtaskUpdate,
    db: AsyncSession = Depends(get_db),
    ctx: SubtaskContext = Depends(require_subtask_admin_or_assignee),
) -> Subtask:
    return await task_service.update_subtask(db, ctx.subtask, data.is_done)


@router.delete("/subtasks/{subtask_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_subtask(
    db: AsyncSession = Depends(get_db),
    ctx: SubtaskContext = Depends(require_subtask_admin_or_assignee),
) -> None:
    await task_service.delete_subtask(db, ctx.subtask)

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import (
    TaskContext,
    get_current_membership,
    get_db,
    require_role,
    require_task_admin_or_assignee,
)
from app.models.label import Label
from app.models.workspace import Membership, Role
from app.schemas.label import LabelCreate, LabelResponse, LabelUpdate
from app.schemas.task import TaskResponse
from app.services import label_service, task_service
from app.services.label_service import LabelNotFoundError

router = APIRouter(tags=["labels"])

_LABEL_NOT_FOUND = HTTPException(
    status_code=status.HTTP_404_NOT_FOUND, detail="Label not found"
)


# --- workspace-scoped label CRUD ---

@router.post(
    "/workspaces/{workspace_id}/labels",
    response_model=LabelResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_label(
    workspace_id: uuid.UUID,
    data: LabelCreate,
    db: AsyncSession = Depends(get_db),
    _admin: Membership = Depends(require_role(Role.ADMIN)),
) -> Label:
    return await label_service.create_label(db, workspace_id, data)


@router.get("/workspaces/{workspace_id}/labels", response_model=list[LabelResponse])
async def list_labels(
    workspace_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _member: Membership = Depends(get_current_membership),
) -> list[Label]:
    return await label_service.list_labels(db, workspace_id)


@router.patch(
    "/workspaces/{workspace_id}/labels/{label_id}", response_model=LabelResponse
)
async def update_label(
    workspace_id: uuid.UUID,
    label_id: uuid.UUID,
    data: LabelUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: Membership = Depends(require_role(Role.ADMIN)),
) -> Label:
    try:
        return await label_service.update_label(db, workspace_id, label_id, data)
    except LabelNotFoundError:
        raise _LABEL_NOT_FOUND


@router.delete(
    "/workspaces/{workspace_id}/labels/{label_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_label(
    workspace_id: uuid.UUID,
    label_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: Membership = Depends(require_role(Role.ADMIN)),
) -> None:
    try:
        await label_service.delete_label(db, workspace_id, label_id)
    except LabelNotFoundError:
        raise _LABEL_NOT_FOUND


# --- attach / detach on a task (admin or assignee) ---

@router.post(
    "/tasks/{task_id}/labels/{label_id}",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
)
async def attach_label(
    label_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    ctx: TaskContext = Depends(require_task_admin_or_assignee),
) -> object:
    try:
        await label_service.attach_label(
            db, ctx.task.id, label_id, ctx.membership.workspace_id
        )
    except LabelNotFoundError:
        raise _LABEL_NOT_FOUND
    return await task_service.get_task_detail(db, ctx.task.id)


@router.delete(
    "/tasks/{task_id}/labels/{label_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def detach_label(
    label_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    ctx: TaskContext = Depends(require_task_admin_or_assignee),
) -> None:
    try:
        await label_service.detach_label(
            db, ctx.task.id, label_id, ctx.membership.workspace_id
        )
    except LabelNotFoundError:
        raise _LABEL_NOT_FOUND

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_membership, get_db, require_role
from app.models.project import Project
from app.models.workspace import Membership, Role
from app.schemas.project import (
    ProjectCreate,
    ProjectProgress,
    ProjectResponse,
    ProjectUpdate,
)
from app.services import project_service
from app.services.project_service import ProjectNotFoundError

router = APIRouter(prefix="/workspaces/{workspace_id}/projects", tags=["projects"])

_NOT_FOUND = HTTPException(
    status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
)


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    workspace_id: uuid.UUID,
    data: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    admin: Membership = Depends(require_role(Role.ADMIN)),
) -> Project:
    return await project_service.create_project(db, workspace_id, admin.user_id, data)


@router.get("", response_model=list[ProjectResponse])
async def list_projects(
    workspace_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _member: Membership = Depends(get_current_membership),
) -> list[Project]:
    return await project_service.list_projects(db, workspace_id)


# Declared before /{project_id} so "trash" isn't captured as a project id.
@router.get("/trash", response_model=list[ProjectResponse])
async def list_trash(
    workspace_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: Membership = Depends(require_role(Role.ADMIN)),
) -> list[Project]:
    return await project_service.list_trash(db, workspace_id)


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    workspace_id: uuid.UUID,
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _member: Membership = Depends(get_current_membership),
) -> Project:
    try:
        return await project_service.get_project(db, workspace_id, project_id)
    except ProjectNotFoundError:
        raise _NOT_FOUND


@router.get("/{project_id}/progress", response_model=ProjectProgress)
async def get_project_progress(
    workspace_id: uuid.UUID,
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _member: Membership = Depends(get_current_membership),
) -> ProjectProgress:
    try:
        return await project_service.get_progress(db, workspace_id, project_id)
    except ProjectNotFoundError:
        raise _NOT_FOUND


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    workspace_id: uuid.UUID,
    project_id: uuid.UUID,
    data: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: Membership = Depends(require_role(Role.ADMIN)),
) -> Project:
    try:
        return await project_service.update_project(db, workspace_id, project_id, data)
    except ProjectNotFoundError:
        raise _NOT_FOUND


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    workspace_id: uuid.UUID,
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin: Membership = Depends(require_role(Role.ADMIN)),
) -> None:
    try:
        await project_service.soft_delete_project(
            db, workspace_id, admin.user_id, project_id
        )
    except ProjectNotFoundError:
        raise _NOT_FOUND


@router.post("/{project_id}/restore", response_model=ProjectResponse)
async def restore_project(
    workspace_id: uuid.UUID,
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: Membership = Depends(require_role(Role.ADMIN)),
) -> Project:
    try:
        return await project_service.restore_project(db, workspace_id, project_id)
    except ProjectNotFoundError:
        raise _NOT_FOUND

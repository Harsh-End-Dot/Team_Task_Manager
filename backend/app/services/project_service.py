import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Project
from app.models.task import Task, TaskStatus
from app.schemas.project import ProjectCreate, ProjectProgress, ProjectUpdate
from app.services import activity_service
from app.utils.queries import not_deleted


class ProjectError(Exception):
    """Base class for project domain errors."""


class ProjectNotFoundError(ProjectError):
    pass


async def _fetch(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    project_id: uuid.UUID,
    *,
    deleted: bool | None = False,
) -> Project | None:
    """Load one project scoped to the workspace.

    deleted=False -> active only (deleted_at IS NULL)
    deleted=True  -> soft-deleted only (deleted_at IS NOT NULL)
    deleted=None  -> either
    """
    stmt = select(Project).where(
        Project.id == project_id, Project.workspace_id == workspace_id
    )
    if deleted is False:
        stmt = stmt.where(not_deleted(Project))
    elif deleted is True:
        stmt = stmt.where(Project.deleted_at.is_not(None))
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def create_project(
    db: AsyncSession, workspace_id: uuid.UUID, actor_id: uuid.UUID, data: ProjectCreate
) -> Project:
    project = Project(
        workspace_id=workspace_id,
        name=data.name,
        description=data.description,
        due_date=data.due_date,
    )
    db.add(project)
    await db.flush()
    activity_service.record(db, workspace_id, actor_id, "project.created", project.name)
    await db.commit()
    await db.refresh(project)
    return project


async def get_active_project_by_id(
    db: AsyncSession, project_id: uuid.UUID
) -> Project | None:
    """Load an active project by id alone (used by auth context to resolve the
    workspace before the caller's membership is known)."""
    result = await db.execute(
        select(Project).where(Project.id == project_id, not_deleted(Project))
    )
    return result.scalar_one_or_none()


async def list_projects(
    db: AsyncSession, workspace_id: uuid.UUID
) -> list[Project]:
    result = await db.execute(
        select(Project)
        .where(Project.workspace_id == workspace_id, not_deleted(Project))
        .order_by(Project.created_at)
    )
    return list(result.scalars().all())


async def list_trash(db: AsyncSession, workspace_id: uuid.UUID) -> list[Project]:
    result = await db.execute(
        select(Project)
        .where(Project.workspace_id == workspace_id, Project.deleted_at.is_not(None))
        .order_by(Project.deleted_at.desc())
    )
    return list(result.scalars().all())


async def get_project(
    db: AsyncSession, workspace_id: uuid.UUID, project_id: uuid.UUID
) -> Project:
    project = await _fetch(db, workspace_id, project_id, deleted=False)
    if project is None:
        raise ProjectNotFoundError("Project not found")
    return project


async def update_project(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    project_id: uuid.UUID,
    data: ProjectUpdate,
) -> Project:
    project = await get_project(db, workspace_id, project_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(project, field, value)
    await db.commit()
    await db.refresh(project)
    return project


async def soft_delete_project(
    db: AsyncSession, workspace_id: uuid.UUID, actor_id: uuid.UUID, project_id: uuid.UUID
) -> None:
    project = await get_project(db, workspace_id, project_id)
    project.deleted_at = datetime.now(timezone.utc)
    # Cascade is READ-TIME (Phase 6): task reads also require the parent
    # project's deleted_at IS NULL, so setting this hides all of the project's
    # tasks without stamping them. Restoring the project brings back exactly the
    # tasks that were not individually soft-deleted.
    activity_service.record(db, workspace_id, actor_id, "project.deleted", project.name)
    await db.commit()


async def restore_project(
    db: AsyncSession, workspace_id: uuid.UUID, project_id: uuid.UUID
) -> Project:
    project = await _fetch(db, workspace_id, project_id, deleted=True)
    if project is None:
        raise ProjectNotFoundError("Soft-deleted project not found")
    project.deleted_at = None
    await db.commit()
    await db.refresh(project)
    return project


async def get_progress(
    db: AsyncSession, workspace_id: uuid.UUID, project_id: uuid.UUID
) -> ProjectProgress:
    # Ensure the project exists and is active (tenant + soft-delete scoped).
    project = await get_project(db, workspace_id, project_id)

    total = await db.scalar(
        select(func.count())
        .select_from(Task)
        .where(Task.project_id == project.id, not_deleted(Task))
    )
    done = await db.scalar(
        select(func.count())
        .select_from(Task)
        .where(
            Task.project_id == project.id,
            not_deleted(Task),
            Task.status == TaskStatus.DONE,
        )
    )
    percent = round(done / total * 100, 2) if total else 0.0
    return ProjectProgress(
        project_id=project.id, total_tasks=total, done_tasks=done, percent=percent
    )

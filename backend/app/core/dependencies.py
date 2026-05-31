import uuid
from dataclasses import dataclass

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.comment import Comment
from app.models.project import Project
from app.models.task import Subtask, Task
from app.models.user import User
from app.models.workspace import Membership, Role
from app.services import (
    comment_service,
    project_service,
    task_service,
    workspace_service,
)

# Re-export so other modules can import the session dependency from here.
__all__ = [
    "get_db",
    "get_current_user",
    "get_current_membership",
    "require_role",
    "get_project_context",
    "require_project_admin",
    "get_active_task_context",
    "require_task_admin",
    "require_task_admin_or_assignee",
    "require_deleted_task_admin",
    "get_subtask_context",
    "require_subtask_admin_or_assignee",
    "get_comment_context",
    "require_comment_author_or_admin",
]

bearer_scheme = HTTPBearer(auto_error=True)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Resolve the bearer JWT into the current User, loaded from the database."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_access_token(credentials.credentials)
    if payload is None:
        raise credentials_exception
    sub = payload.get("sub")
    if sub is None:
        raise credentials_exception

    try:
        user_id = uuid.UUID(str(sub))
    except ValueError:
        raise credentials_exception

    user = await db.get(User, user_id)
    if user is None:
        raise credentials_exception
    return user


async def get_current_membership(
    workspace_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Membership:
    """Load the caller's Membership in the workspace named by the path.

    Routes must declare a `workspace_id` path parameter. Returns the Membership
    so downstream handlers know the caller's role; 404 if the caller is not a
    member (which doubles as tenant isolation — non-members can't tell whether
    a workspace exists).
    """
    membership = await workspace_service.get_membership(
        db, workspace_id, current_user.id
    )
    if membership is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found",
        )
    return membership


def require_role(*roles: Role):
    """Dependency factory enforcing the caller's role in the path workspace.

    404 if the caller isn't a member (via get_current_membership), 403 if they
    are a member but lack one of the required roles.
    """

    async def _role_checker(
        membership: Membership = Depends(get_current_membership),
    ) -> Membership:
        if membership.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions for this workspace",
            )
        return membership

    return _role_checker


# --- Context resolvers for project/task/subtask-scoped routes ---
# These routes are keyed by project_id / task_id / subtask_id (no workspace_id
# in the path), so they walk the parent chain up to the workspace, then load the
# caller's Membership for RBAC. Missing entity OR non-member both yield 404 so
# non-members can't probe for existence (tenant isolation).

_ADMIN_REQUIRED = HTTPException(
    status_code=status.HTTP_403_FORBIDDEN, detail="Admin role required"
)
_ADMIN_OR_ASSIGNEE_REQUIRED = HTTPException(
    status_code=status.HTTP_403_FORBIDDEN,
    detail="Must be an admin or the task assignee",
)


@dataclass
class ProjectContext:
    project: Project
    membership: Membership
    user: User


@dataclass
class TaskContext:
    task: Task
    membership: Membership
    user: User


@dataclass
class SubtaskContext:
    subtask: Subtask
    task: Task
    membership: Membership
    user: User


async def _membership_or_404(
    db: AsyncSession, workspace_id: uuid.UUID, user_id: uuid.UUID, detail: str
) -> Membership:
    membership = await workspace_service.get_membership(db, workspace_id, user_id)
    if membership is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=detail)
    return membership


async def get_project_context(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ProjectContext:
    project = await project_service.get_active_project_by_id(db, project_id)
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        )
    membership = await _membership_or_404(
        db, project.workspace_id, current_user.id, "Project not found"
    )
    return ProjectContext(project=project, membership=membership, user=current_user)


async def require_project_admin(
    ctx: ProjectContext = Depends(get_project_context),
) -> ProjectContext:
    if ctx.membership.role != Role.ADMIN:
        raise _ADMIN_REQUIRED
    return ctx


async def _resolve_task(
    db: AsyncSession, task_id: uuid.UUID, current_user: User, *, deleted: bool
) -> TaskContext:
    found = await task_service.get_task_with_project(db, task_id)
    if found is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
        )
    task, project = found
    # A task is visible only when itself active AND its parent project active
    # (the read-time project->task cascade). Restore wants the opposite task
    # state but still an active project.
    if deleted:
        visible = task.deleted_at is not None and project.deleted_at is None
    else:
        visible = task.deleted_at is None and project.deleted_at is None
    if not visible:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
        )
    membership = await _membership_or_404(
        db, project.workspace_id, current_user.id, "Task not found"
    )
    return TaskContext(task=task, membership=membership, user=current_user)


async def get_active_task_context(
    task_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TaskContext:
    return await _resolve_task(db, task_id, current_user, deleted=False)


async def get_deleted_task_context(
    task_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TaskContext:
    return await _resolve_task(db, task_id, current_user, deleted=True)


async def require_task_admin(
    ctx: TaskContext = Depends(get_active_task_context),
) -> TaskContext:
    if ctx.membership.role != Role.ADMIN:
        raise _ADMIN_REQUIRED
    return ctx


async def require_task_admin_or_assignee(
    ctx: TaskContext = Depends(get_active_task_context),
) -> TaskContext:
    if ctx.membership.role != Role.ADMIN and ctx.task.assignee_id != ctx.user.id:
        raise _ADMIN_OR_ASSIGNEE_REQUIRED
    return ctx


async def require_deleted_task_admin(
    ctx: TaskContext = Depends(get_deleted_task_context),
) -> TaskContext:
    if ctx.membership.role != Role.ADMIN:
        raise _ADMIN_REQUIRED
    return ctx


async def get_subtask_context(
    subtask_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SubtaskContext:
    found = await task_service.get_subtask_with_task_project(db, subtask_id)
    if found is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Subtask not found"
        )
    subtask, task, project = found
    if task.deleted_at is not None or project.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Subtask not found"
        )
    membership = await _membership_or_404(
        db, project.workspace_id, current_user.id, "Subtask not found"
    )
    return SubtaskContext(
        subtask=subtask, task=task, membership=membership, user=current_user
    )


async def require_subtask_admin_or_assignee(
    ctx: SubtaskContext = Depends(get_subtask_context),
) -> SubtaskContext:
    if ctx.membership.role != Role.ADMIN and ctx.task.assignee_id != ctx.user.id:
        raise _ADMIN_OR_ASSIGNEE_REQUIRED
    return ctx


@dataclass
class CommentContext:
    comment: Comment
    membership: Membership
    user: User


async def get_comment_context(
    comment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CommentContext:
    found = await comment_service.get_comment_with_task_project(db, comment_id)
    if found is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found"
        )
    comment, task, project = found
    if task.deleted_at is not None or project.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found"
        )
    membership = await _membership_or_404(
        db, project.workspace_id, current_user.id, "Comment not found"
    )
    return CommentContext(comment=comment, membership=membership, user=current_user)


async def require_comment_author_or_admin(
    ctx: CommentContext = Depends(get_comment_context),
) -> CommentContext:
    if ctx.membership.role != Role.ADMIN and ctx.comment.author_id != ctx.user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Must be the comment author or an admin",
        )
    return ctx

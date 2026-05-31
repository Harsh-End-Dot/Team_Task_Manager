import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.workspace import Membership, Role, Workspace
from app.schemas.workspace import WorkspaceCreate


class WorkspaceError(Exception):
    """Base class for workspace domain errors."""


class MembershipNotFoundError(WorkspaceError):
    pass


class LastAdminError(WorkspaceError):
    """Raised when an action would leave a workspace with zero admins."""


# Single source of truth for the 409 message.
_LAST_ADMIN_MESSAGE = "A workspace must have at least one admin"


async def _count_admins_for_update(
    db: AsyncSession, workspace_id: uuid.UUID
) -> int:
    """Count a workspace's ADMINs while row-locking them (SELECT ... FOR UPDATE).

    Locking the admin membership rows serializes concurrent demote/remove
    actions on the same workspace: a second transaction touching this workspace's
    admins blocks until the first commits, then re-evaluates against the now
    up-to-date set — so two callers can't both pass the guard and orphan the
    workspace. (Aggregates can't be combined with FOR UPDATE in Postgres, so we
    lock the rows and count them in Python.)
    """
    result = await db.execute(
        select(Membership)
        .where(
            Membership.workspace_id == workspace_id,
            Membership.role == Role.ADMIN,
        )
        .with_for_update()
    )
    return len(result.scalars().all())


async def create_workspace(
    db: AsyncSession, user: User, data: WorkspaceCreate
) -> Workspace:
    """Create a workspace and make the creator an ADMIN member."""
    workspace = Workspace(name=data.name)
    db.add(workspace)
    await db.flush()  # assign workspace.id before creating the membership

    membership = Membership(
        workspace_id=workspace.id, user_id=user.id, role=Role.ADMIN
    )
    db.add(membership)

    await db.commit()
    await db.refresh(workspace)
    return workspace


async def list_my_workspaces(db: AsyncSession, user_id: uuid.UUID) -> list[Workspace]:
    result = await db.execute(
        select(Workspace)
        .join(Membership, Membership.workspace_id == Workspace.id)
        .where(Membership.user_id == user_id)
        .order_by(Workspace.created_at)
    )
    return list(result.scalars().all())


async def get_membership(
    db: AsyncSession, workspace_id: uuid.UUID, user_id: uuid.UUID
) -> Membership | None:
    result = await db.execute(
        select(Membership).where(
            Membership.workspace_id == workspace_id,
            Membership.user_id == user_id,
        )
    )
    return result.scalar_one_or_none()


async def list_members(
    db: AsyncSession, workspace_id: uuid.UUID
) -> list[Membership]:
    result = await db.execute(
        select(Membership)
        .where(Membership.workspace_id == workspace_id)
        .order_by(Membership.created_at)
    )
    return list(result.scalars().all())


async def update_member_role(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    target_user_id: uuid.UUID,
    role: Role,
) -> Membership:
    membership = await get_membership(db, workspace_id, target_user_id)
    if membership is None:
        raise MembershipNotFoundError("User is not a member of this workspace")
    # Block demoting the only remaining admin. The locked count is taken in the
    # same transaction as the update, so concurrent demote/remove can't both slip
    # through (see _count_admins_for_update).
    if membership.role == Role.ADMIN and role != Role.ADMIN:
        if await _count_admins_for_update(db, workspace_id) <= 1:
            raise LastAdminError(_LAST_ADMIN_MESSAGE)
    membership.role = role
    await db.commit()
    await db.refresh(membership)
    return membership


async def remove_member(
    db: AsyncSession, workspace_id: uuid.UUID, target_user_id: uuid.UUID
) -> None:
    membership = await get_membership(db, workspace_id, target_user_id)
    if membership is None:
        raise MembershipNotFoundError("User is not a member of this workspace")
    # Block removing the only remaining admin (atomic against concurrent actions).
    if membership.role == Role.ADMIN:
        if await _count_admins_for_update(db, workspace_id) <= 1:
            raise LastAdminError(_LAST_ADMIN_MESSAGE)
    await db.delete(membership)
    await db.commit()

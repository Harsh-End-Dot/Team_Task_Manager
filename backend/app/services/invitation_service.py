import secrets
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.invitation import Invitation
from app.models.user import User
from app.models.workspace import Membership, Role
from app.services import activity_service, workspace_service

INVITE_TTL = timedelta(days=7)


class InvitationError(Exception):
    """Base class for invitation domain errors."""


class InvitationNotFoundError(InvitationError):
    pass


class InvalidInvitationError(InvitationError):
    """Token missing, expired, or already consumed."""


class AlreadyMemberError(InvitationError):
    pass


class TooManyPendingInvitationsError(InvitationError):
    """Workspace has hit the cap on pending (unaccepted, unexpired) invitations.

    A business-level guard (separate from the time-window rate limit) so the
    shared email quota is protected even within an allowed rate window.
    """


async def count_pending(db: AsyncSession, workspace_id: uuid.UUID) -> int:
    """Number of unaccepted, unexpired invitations for a workspace."""
    now = datetime.now(timezone.utc)
    result = await db.scalar(
        select(func.count())
        .select_from(Invitation)
        .where(
            Invitation.workspace_id == workspace_id,
            Invitation.accepted_at.is_(None),
            Invitation.expires_at > now,
        )
    )
    return result or 0


async def create_invitation(
    db: AsyncSession, workspace_id: uuid.UUID, email: str, role: Role
) -> Invitation:
    cap = settings.MAX_PENDING_INVITATIONS_PER_WORKSPACE
    if await count_pending(db, workspace_id) >= cap:
        raise TooManyPendingInvitationsError(
            f"This workspace already has the maximum of {cap} pending "
            f"invitations. Revoke some, or wait for them to be accepted or to "
            f"expire, before sending more."
        )

    token = secrets.token_urlsafe(32)
    invitation = Invitation(
        workspace_id=workspace_id,
        email=email,
        token=token,
        role=role,
        expires_at=datetime.now(timezone.utc) + INVITE_TTL,
    )
    db.add(invitation)
    await db.commit()
    await db.refresh(invitation)
    # The invite email is scheduled by the router (BackgroundTasks); see
    # app/notifications/notifications.py.
    return invitation


async def list_pending(
    db: AsyncSession, workspace_id: uuid.UUID
) -> list[Invitation]:
    result = await db.execute(
        select(Invitation)
        .where(
            Invitation.workspace_id == workspace_id,
            Invitation.accepted_at.is_(None),
        )
        .order_by(Invitation.created_at)
    )
    return list(result.scalars().all())


async def revoke_invitation(
    db: AsyncSession, workspace_id: uuid.UUID, invite_id: uuid.UUID
) -> None:
    result = await db.execute(
        select(Invitation).where(
            Invitation.id == invite_id,
            Invitation.workspace_id == workspace_id,
        )
    )
    invitation = result.scalar_one_or_none()
    if invitation is None:
        raise InvitationNotFoundError("Invitation not found")
    await db.delete(invitation)
    await db.commit()


async def accept_invitation(
    db: AsyncSession, user: User, token: str
) -> Membership:
    result = await db.execute(select(Invitation).where(Invitation.token == token))
    invitation = result.scalar_one_or_none()

    now = datetime.now(timezone.utc)
    if (
        invitation is None
        or invitation.accepted_at is not None
        or invitation.expires_at <= now
    ):
        raise InvalidInvitationError("Invalid or expired invitation")

    existing = await workspace_service.get_membership(
        db, invitation.workspace_id, user.id
    )
    if existing is not None:
        raise AlreadyMemberError("Already a member of this workspace")

    membership = Membership(
        workspace_id=invitation.workspace_id,
        user_id=user.id,
        role=invitation.role,
    )
    db.add(membership)
    invitation.accepted_at = now
    activity_service.record(
        db, invitation.workspace_id, user.id, "member.joined", user.email
    )
    await db.commit()
    await db.refresh(membership)
    return membership

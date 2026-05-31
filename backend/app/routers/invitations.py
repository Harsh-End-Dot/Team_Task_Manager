import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db, require_role
from app.core.rate_limit import invitation_limit, limiter
from app.models.invitation import Invitation
from app.models.user import User
from app.models.workspace import Membership, Role
from app.notifications import notifications
from app.schemas.invitation import (
    InvitationAccept,
    InvitationCreate,
    InvitationResponse,
)
from app.schemas.workspace import MembershipResponse
from app.services import invitation_service
from app.services.invitation_service import (
    AlreadyMemberError,
    InvalidInvitationError,
    InvitationNotFoundError,
    TooManyPendingInvitationsError,
)

router = APIRouter(tags=["invitations"])


@router.post(
    "/workspaces/{workspace_id}/invitations",
    response_model=InvitationResponse,
    status_code=status.HTTP_201_CREATED,
)
# Per-user time-window limit (sends email via the external API — top priority).
# `request: Request` is required by slowapi to identify the caller.
@limiter.limit(invitation_limit)
async def create_invitation(
    request: Request,
    workspace_id: uuid.UUID,
    data: InvitationCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    _admin: Membership = Depends(require_role(Role.ADMIN)),
) -> Invitation:
    try:
        invitation = await invitation_service.create_invitation(
            db, workspace_id, data.email, data.role
        )
    except TooManyPendingInvitationsError as exc:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=str(exc)
        )
    notifications.send_invitation_email(
        background_tasks, to=invitation.email, token=invitation.token
    )
    return invitation


@router.get(
    "/workspaces/{workspace_id}/invitations",
    response_model=list[InvitationResponse],
)
async def list_invitations(
    workspace_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: Membership = Depends(require_role(Role.ADMIN)),
) -> list[Invitation]:
    return await invitation_service.list_pending(db, workspace_id)


@router.delete(
    "/workspaces/{workspace_id}/invitations/{invite_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def revoke_invitation(
    workspace_id: uuid.UUID,
    invite_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: Membership = Depends(require_role(Role.ADMIN)),
) -> None:
    try:
        await invitation_service.revoke_invitation(db, workspace_id, invite_id)
    except InvitationNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Invitation not found"
        )


@router.post("/invitations/accept", response_model=MembershipResponse)
async def accept_invitation(
    data: InvitationAccept,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Membership:
    try:
        return await invitation_service.accept_invitation(db, current_user, data.token)
    except InvalidInvitationError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired invitation",
        )
    except AlreadyMemberError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Already a member of this workspace",
        )

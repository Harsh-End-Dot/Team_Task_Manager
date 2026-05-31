import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import (
    get_current_membership,
    get_current_user,
    get_db,
    require_role,
)
from app.models.user import User
from app.models.workspace import Membership, Role, Workspace
from app.schemas.workspace import (
    MemberRoleUpdate,
    MembershipResponse,
    WorkspaceCreate,
    WorkspaceResponse,
)
from app.services import workspace_service
from app.services.workspace_service import LastAdminError, MembershipNotFoundError

router = APIRouter(prefix="/workspaces", tags=["workspaces"])


@router.post("", response_model=WorkspaceResponse, status_code=status.HTTP_201_CREATED)
async def create_workspace(
    data: WorkspaceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Workspace:
    return await workspace_service.create_workspace(db, current_user, data)


@router.get("", response_model=list[WorkspaceResponse])
async def list_my_workspaces(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Workspace]:
    return await workspace_service.list_my_workspaces(db, current_user.id)


@router.get("/{workspace_id}/members", response_model=list[MembershipResponse])
async def list_members(
    workspace_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _membership: Membership = Depends(get_current_membership),
) -> list[Membership]:
    return await workspace_service.list_members(db, workspace_id)


@router.patch(
    "/{workspace_id}/members/{user_id}", response_model=MembershipResponse
)
async def update_member_role(
    workspace_id: uuid.UUID,
    user_id: uuid.UUID,
    data: MemberRoleUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: Membership = Depends(require_role(Role.ADMIN)),
) -> Membership:
    try:
        return await workspace_service.update_member_role(
            db, workspace_id, user_id, data.role
        )
    except MembershipNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User is not a member of this workspace",
        )
    except LastAdminError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail=str(exc)
        )


@router.delete(
    "/{workspace_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def remove_member(
    workspace_id: uuid.UUID,
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: Membership = Depends(require_role(Role.ADMIN)),
) -> None:
    try:
        await workspace_service.remove_member(db, workspace_id, user_id)
    except MembershipNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User is not a member of this workspace",
        )
    except LastAdminError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail=str(exc)
        )

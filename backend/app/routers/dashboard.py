import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_membership, get_db
from app.models.workspace import Membership
from app.schemas.dashboard import DashboardResponse
from app.services import dashboard_service

router = APIRouter(tags=["dashboard"])


@router.get(
    "/workspaces/{workspace_id}/dashboard", response_model=DashboardResponse
)
async def get_dashboard(
    workspace_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    membership: Membership = Depends(get_current_membership),
) -> DashboardResponse:
    return await dashboard_service.get_dashboard(db, workspace_id, membership.user_id)

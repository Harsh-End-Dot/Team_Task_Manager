import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_membership, get_db
from app.models.activity import Activity
from app.models.workspace import Membership
from app.schemas.activity import ActivityResponse
from app.services import activity_service

router = APIRouter(tags=["activity"])


@router.get(
    "/workspaces/{workspace_id}/activity", response_model=list[ActivityResponse]
)
async def list_activity(
    workspace_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _member: Membership = Depends(get_current_membership),
) -> list[Activity]:
    return await activity_service.list_activity(db, workspace_id)

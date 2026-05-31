import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_membership, get_db
from app.models.workspace import Membership
from app.schemas.search import SearchResponse
from app.services import search_service

router = APIRouter(tags=["search"])


@router.get("/workspaces/{workspace_id}/search", response_model=SearchResponse)
async def search(
    workspace_id: uuid.UUID,
    q: str = Query(min_length=1),
    db: AsyncSession = Depends(get_db),
    _member: Membership = Depends(get_current_membership),
) -> SearchResponse:
    projects, tasks = await search_service.search(db, workspace_id, q)
    return SearchResponse(projects=projects, tasks=tasks)

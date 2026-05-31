import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.activity import Activity


def record(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    actor_id: uuid.UUID | None,
    verb: str,
    target: str | None = None,
) -> Activity:
    """Stage an activity row on the session.

    Does NOT commit — the calling service commits as part of its own
    transaction so the action and its audit row succeed or fail together.
    """
    activity = Activity(
        workspace_id=workspace_id, actor_id=actor_id, verb=verb, target=target
    )
    db.add(activity)
    return activity


async def list_activity(
    db: AsyncSession, workspace_id: uuid.UUID, limit: int = 100
) -> list[Activity]:
    result = await db.execute(
        select(Activity)
        .where(Activity.workspace_id == workspace_id)
        .order_by(Activity.created_at.desc())
        .limit(limit)
    )
    return list(result.scalars().all())

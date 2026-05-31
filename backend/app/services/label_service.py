import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.label import Label, TaskLabel
from app.schemas.label import LabelCreate, LabelUpdate


class LabelError(Exception):
    """Base class for label domain errors."""


class LabelNotFoundError(LabelError):
    pass


async def create_label(
    db: AsyncSession, workspace_id: uuid.UUID, data: LabelCreate
) -> Label:
    label = Label(workspace_id=workspace_id, name=data.name, color=data.color)
    db.add(label)
    await db.commit()
    await db.refresh(label)
    return label


async def list_labels(db: AsyncSession, workspace_id: uuid.UUID) -> list[Label]:
    result = await db.execute(
        select(Label).where(Label.workspace_id == workspace_id).order_by(Label.name)
    )
    return list(result.scalars().all())


async def get_label(
    db: AsyncSession, workspace_id: uuid.UUID, label_id: uuid.UUID
) -> Label:
    result = await db.execute(
        select(Label).where(Label.id == label_id, Label.workspace_id == workspace_id)
    )
    label = result.scalar_one_or_none()
    if label is None:
        raise LabelNotFoundError("Label not found")
    return label


async def update_label(
    db: AsyncSession, workspace_id: uuid.UUID, label_id: uuid.UUID, data: LabelUpdate
) -> Label:
    label = await get_label(db, workspace_id, label_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(label, field, value)
    await db.commit()
    await db.refresh(label)
    return label


async def delete_label(
    db: AsyncSession, workspace_id: uuid.UUID, label_id: uuid.UUID
) -> None:
    label = await get_label(db, workspace_id, label_id)
    # task_labels rows are removed by the FK ON DELETE CASCADE.
    await db.delete(label)
    await db.commit()


async def attach_label(
    db: AsyncSession,
    task_id: uuid.UUID,
    label_id: uuid.UUID,
    workspace_id: uuid.UUID,
) -> None:
    # Tenant guard: the label must belong to the task's workspace.
    await get_label(db, workspace_id, label_id)
    existing = await db.get(TaskLabel, (task_id, label_id))
    if existing is None:
        db.add(TaskLabel(task_id=task_id, label_id=label_id))
        await db.commit()


async def detach_label(
    db: AsyncSession,
    task_id: uuid.UUID,
    label_id: uuid.UUID,
    workspace_id: uuid.UUID,
) -> None:
    await get_label(db, workspace_id, label_id)
    existing = await db.get(TaskLabel, (task_id, label_id))
    if existing is not None:
        await db.delete(existing)
        await db.commit()

import uuid

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Project
from app.models.task import Task
from app.utils.queries import not_deleted


def _like_pattern(q: str) -> str:
    """Escape LIKE wildcards in user input, then wrap for a contains match."""
    escaped = q.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    return f"%{escaped}%"


async def search(
    db: AsyncSession, workspace_id: uuid.UUID, q: str
) -> tuple[list[Project], list[Task]]:
    pattern = _like_pattern(q)

    project_result = await db.execute(
        select(Project)
        .where(
            Project.workspace_id == workspace_id,
            not_deleted(Project),
            or_(
                Project.name.ilike(pattern, escape="\\"),
                Project.description.ilike(pattern, escape="\\"),
            ),
        )
        .order_by(Project.name)
    )
    projects = list(project_result.scalars().all())

    task_result = await db.execute(
        select(Task)
        .join(Project, Task.project_id == Project.id)
        .where(
            Project.workspace_id == workspace_id,
            not_deleted(Task),
            not_deleted(Project),
            or_(
                Task.title.ilike(pattern, escape="\\"),
                Task.description.ilike(pattern, escape="\\"),
            ),
        )
        .order_by(Task.title)
    )
    tasks = list(task_result.scalars().all())

    return projects, tasks

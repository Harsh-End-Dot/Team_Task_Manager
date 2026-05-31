import re
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.comment import Comment, CommentMention
from app.models.project import Project
from app.models.task import Task
from app.models.user import User
from app.models.workspace import Membership
from app.realtime.manager import notify
from app.services import activity_service

# A mention is "@" followed by a member's email, e.g. "@alice@example.com".
_MENTION_RE = re.compile(r"@([A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,})")


def _parse_mention_emails(body: str) -> set[str]:
    return {m.group(1).lower() for m in _MENTION_RE.finditer(body)}


async def _detail(db: AsyncSession, comment_id: uuid.UUID) -> Comment:
    result = await db.execute(
        select(Comment)
        .where(Comment.id == comment_id)
        .options(selectinload(Comment.mentioned_users))
    )
    return result.scalar_one()


async def get_comment_with_task_project(
    db: AsyncSession, comment_id: uuid.UUID
) -> tuple[Comment, Task, Project] | None:
    result = await db.execute(
        select(Comment, Task, Project)
        .join(Task, Comment.task_id == Task.id)
        .join(Project, Task.project_id == Project.id)
        .where(Comment.id == comment_id)
    )
    row = result.first()
    return (row[0], row[1], row[2]) if row is not None else None


async def create_comment(
    db: AsyncSession,
    task: Task,
    author_id: uuid.UUID,
    workspace_id: uuid.UUID,
    body: str,
) -> Comment:
    comment = Comment(task_id=task.id, author_id=author_id, body=body)
    db.add(comment)
    await db.flush()  # assign comment.id

    # Resolve @mentions, but only to members of THIS workspace.
    emails = _parse_mention_emails(body)
    if emails:
        result = await db.execute(
            select(User)
            .join(Membership, Membership.user_id == User.id)
            .where(
                Membership.workspace_id == workspace_id,
                User.email.in_(emails),
            )
        )
        for user in result.scalars().all():
            db.add(CommentMention(comment_id=comment.id, user_id=user.id))
            # Mention emails are scheduled by the router (BackgroundTasks) from
            # the returned comment.mentioned_users.

    activity_service.record(db, workspace_id, author_id, "comment.added", task.title)
    await db.commit()
    await notify(
        workspace_id, "comment.added", id=str(comment.id), task_id=str(task.id)
    )
    return await _detail(db, comment.id)


async def list_comments(db: AsyncSession, task_id: uuid.UUID) -> list[Comment]:
    result = await db.execute(
        select(Comment)
        .where(Comment.task_id == task_id)
        .options(selectinload(Comment.mentioned_users))
        .order_by(Comment.created_at)
    )
    return list(result.scalars().all())


async def delete_comment(db: AsyncSession, comment: Comment) -> None:
    await db.delete(comment)
    await db.commit()

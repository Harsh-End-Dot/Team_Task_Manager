from fastapi import APIRouter, BackgroundTasks, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import (
    CommentContext,
    TaskContext,
    get_active_task_context,
    get_db,
    require_comment_author_or_admin,
)
from app.models.comment import Comment
from app.notifications import notifications
from app.schemas.comment import CommentCreate, CommentResponse
from app.services import comment_service

router = APIRouter(tags=["comments"])


@router.post(
    "/tasks/{task_id}/comments",
    response_model=CommentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_comment(
    data: CommentCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    ctx: TaskContext = Depends(get_active_task_context),
) -> Comment:
    comment = await comment_service.create_comment(
        db, ctx.task, ctx.user.id, ctx.membership.workspace_id, data.body
    )
    for user in comment.mentioned_users:
        notifications.send_mention_email(
            background_tasks, to=user.email, task_title=ctx.task.title
        )
    return comment


@router.get("/tasks/{task_id}/comments", response_model=list[CommentResponse])
async def list_comments(
    db: AsyncSession = Depends(get_db),
    ctx: TaskContext = Depends(get_active_task_context),
) -> list[Comment]:
    return await comment_service.list_comments(db, ctx.task.id)


@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    db: AsyncSession = Depends(get_db),
    ctx: CommentContext = Depends(require_comment_author_or_admin),
) -> None:
    await comment_service.delete_comment(db, ctx.comment)

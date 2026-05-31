from fastapi import BackgroundTasks

from app.core.config import settings
from app.notifications import email_service


def send_invitation_email(
    background_tasks: BackgroundTasks, *, to: str, token: str
) -> None:
    link = f"{settings.FRONTEND_URL}/invitations/accept?token={token}"
    background_tasks.add_task(
        email_service.send_email,
        to,
        "You've been invited to a workspace",
        html=f'<p>You have been invited to a workspace. '
        f'<a href="{link}">Accept the invitation</a>.</p>',
        text=f"You have been invited to a workspace. Accept it here: {link}",
    )


def send_password_reset_email(
    background_tasks: BackgroundTasks, *, to: str, token: str
) -> None:
    link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    background_tasks.add_task(
        email_service.send_email,
        to,
        "Reset your password",
        html=f'<p>We received a request to reset your password. '
        f'<a href="{link}">Reset it here</a>. This link expires in 1 hour.</p>',
        text=f"Reset your password: {link} (expires in 1 hour)",
    )


def send_mention_email(
    background_tasks: BackgroundTasks, *, to: str, task_title: str
) -> None:
    background_tasks.add_task(
        email_service.send_email,
        to,
        "You were mentioned in a comment",
        html=f"<p>You were mentioned in a comment on the task "
        f"&ldquo;{task_title}&rdquo;.</p>",
        text=f"You were mentioned in a comment on the task: {task_title}",
    )


def send_assignment_email(
    background_tasks: BackgroundTasks, *, to: str, task_title: str
) -> None:
    background_tasks.add_task(
        email_service.send_email,
        to,
        "A task was assigned to you",
        html=f"<p>You were assigned the task &ldquo;{task_title}&rdquo;.</p>",
        text=f"You were assigned the task: {task_title}",
    )

"""Idempotent demo-data seeder.

Run from the backend/ directory with the project venv:

    python seed.py

Re-running is safe: it deletes any existing demo workspace + demo users
(cascading their projects/tasks/comments/etc.) and recreates everything fresh.

Demo logins (password for both): demopass123
    alice@demo.app  (ADMIN)
    bob@demo.app    (MEMBER)
"""
import asyncio
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import delete, select

from app.core.database import async_session_maker
from app.core.security import hash_password
from app.models.activity import Activity
from app.models.comment import Comment, CommentMention
from app.models.label import Label, TaskLabel
from app.models.project import Project
from app.models.task import Subtask, Task, TaskPriority, TaskStatus
from app.models.user import User
from app.models.workspace import Membership, Role, Workspace

WORKSPACE_NAME = "Demo Workspace"
# NOTE: do NOT use a `.test` (or .example/.invalid/.localhost) domain here — those
# are IANA special-use/reserved names that EmailStr (email-validator) rejects, so
# the seeded users could be created (direct DB insert bypasses validation) but
# could never log in via /auth/login (422). Use a normal domain like demo.app.
ALICE_EMAIL = "alice@demo.app"
BOB_EMAIL = "bob@demo.app"
PASSWORD = "demopass123"


async def _cleanup(db) -> None:
    # Delete the demo workspace first (cascades projects -> tasks -> subtasks/
    # comments/labels/activities/invitations), then the demo users.
    workspaces = (
        await db.execute(select(Workspace).where(Workspace.name == WORKSPACE_NAME))
    ).scalars().all()
    for ws in workspaces:
        await db.delete(ws)
    await db.flush()
    await db.execute(delete(User).where(User.email.in_([ALICE_EMAIL, BOB_EMAIL])))
    await db.commit()


async def seed() -> None:
    today = date.today()
    async with async_session_maker() as db:
        await _cleanup(db)

        # --- users ---
        alice = User(email=ALICE_EMAIL, name="Alice Admin", hashed_password=hash_password(PASSWORD))
        bob = User(email=BOB_EMAIL, name="Bob Member", hashed_password=hash_password(PASSWORD))
        db.add_all([alice, bob])
        await db.flush()

        # --- workspace + memberships ---
        ws = Workspace(name=WORKSPACE_NAME)
        db.add(ws)
        await db.flush()
        db.add_all([
            Membership(workspace_id=ws.id, user_id=alice.id, role=Role.ADMIN),
            Membership(workspace_id=ws.id, user_id=bob.id, role=Role.MEMBER),
        ])

        # --- labels ---
        bug = Label(workspace_id=ws.id, name="bug", color="#e11d48")
        feature = Label(workspace_id=ws.id, name="feature", color="#16a34a")
        urgent = Label(workspace_id=ws.id, name="urgent", color="#f59e0b")
        db.add_all([bug, feature, urgent])
        await db.flush()

        # --- projects ---
        website = Project(
            workspace_id=ws.id, name="Website Redesign",
            description="Marketing site refresh", due_date=today + timedelta(days=30),
        )
        mobile = Project(
            workspace_id=ws.id, name="Mobile App",
            description="iOS + Android MVP", due_date=today + timedelta(days=60),
        )
        db.add_all([website, mobile])
        await db.flush()

        # --- tasks: spread across statuses, priorities, due dates ---
        tasks = [
            Task(project_id=website.id, assignee_id=bob.id, title="Design new landing page",
                 description="Hero + pricing sections", status=TaskStatus.IN_PROGRESS,
                 priority=TaskPriority.HIGH, position=0, due_date=today - timedelta(days=2)),  # overdue
            Task(project_id=website.id, assignee_id=alice.id, title="Set up analytics",
                 status=TaskStatus.TODO, priority=TaskPriority.MEDIUM, position=1,
                 due_date=today + timedelta(days=3)),
            Task(project_id=website.id, assignee_id=bob.id, title="Fix nav bug on mobile",
                 description="Menu does not close", status=TaskStatus.TODO,
                 priority=TaskPriority.HIGH, position=2, due_date=today),  # due today
            Task(project_id=website.id, title="Write copy", status=TaskStatus.DONE,
                 priority=TaskPriority.LOW, position=0),
            Task(project_id=mobile.id, assignee_id=alice.id, title="Project scaffolding",
                 status=TaskStatus.DONE, priority=TaskPriority.MEDIUM, position=0),
            Task(project_id=mobile.id, assignee_id=bob.id, title="Push notifications",
                 status=TaskStatus.TODO, priority=TaskPriority.LOW, position=1,
                 due_date=today + timedelta(days=10)),
            Task(project_id=mobile.id, title="Auth screens", status=TaskStatus.IN_PROGRESS,
                 priority=TaskPriority.HIGH, position=2, due_date=today - timedelta(days=1)),  # overdue
        ]
        db.add_all(tasks)
        await db.flush()
        landing, analytics, navbug = tasks[0], tasks[1], tasks[2]

        # --- subtasks ---
        db.add_all([
            Subtask(task_id=landing.id, title="Wireframe", is_done=True),
            Subtask(task_id=landing.id, title="Hi-fi mockup", is_done=False),
            Subtask(task_id=landing.id, title="Dev handoff", is_done=False),
        ])

        # --- labels on tasks ---
        db.add_all([
            TaskLabel(task_id=landing.id, label_id=feature.id),
            TaskLabel(task_id=navbug.id, label_id=bug.id),
            TaskLabel(task_id=navbug.id, label_id=urgent.id),
        ])

        # --- comments (incl. an @mention of bob) ---
        c1 = Comment(task_id=landing.id, author_id=alice.id,
                     body=f"@{BOB_EMAIL} can you take the first pass on this?")
        c2 = Comment(task_id=landing.id, author_id=bob.id, body="On it — wireframe is done.")
        db.add_all([c1, c2])
        await db.flush()
        db.add(CommentMention(comment_id=c1.id, user_id=bob.id))

        # --- activity feed ---
        now = datetime.now(timezone.utc)
        db.add_all([
            Activity(workspace_id=ws.id, actor_id=alice.id, verb="member.joined", target=bob.email),
            Activity(workspace_id=ws.id, actor_id=alice.id, verb="project.created", target=website.name),
            Activity(workspace_id=ws.id, actor_id=alice.id, verb="task.created", target=landing.title),
            Activity(workspace_id=ws.id, actor_id=bob.id, verb="comment.added", target=landing.title),
        ])

        await db.commit()

    print("Seed complete.")
    print(f"  Workspace: {WORKSPACE_NAME}")
    print(f"  Login (password '{PASSWORD}'):")
    print(f"    {ALICE_EMAIL}  (ADMIN)")
    print(f"    {BOB_EMAIL}    (MEMBER)")
    print("  2 projects, 7 tasks (2 overdue, 1 due today), 3 labels, 3 subtasks, 2 comments (1 mention).")


if __name__ == "__main__":
    asyncio.run(seed())

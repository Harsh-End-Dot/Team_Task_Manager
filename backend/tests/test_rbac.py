import uuid

from app.models.workspace import Membership, Role
from tests.helpers import bearer, me_id, register


async def test_admin_vs_member_vs_nonmember(client, db_session):
    admin = await register(client, "admin@x.com", name="Admin")
    member = await register(client, "member@x.com", name="Member")
    outsider = await register(client, "out@x.com", name="Outsider")
    member_uid = await me_id(client, member)

    # Creator becomes ADMIN of their workspace.
    ws_id = (
        await client.post("/workspaces", json={"name": "WS"}, headers=bearer(admin))
    ).json()["id"]

    # Seed the member directly (joining is the invitations flow; not needed here).
    db_session.add(
        Membership(
            workspace_id=uuid.UUID(ws_id),
            user_id=uuid.UUID(member_uid),
            role=Role.MEMBER,
        )
    )
    await db_session.commit()

    # Member is blocked from an admin-only action -> 403.
    blocked = await client.post(
        f"/workspaces/{ws_id}/projects", json={"name": "P"}, headers=bearer(member)
    )
    assert blocked.status_code == 403

    # Non-member can't even see the workspace's projects -> 404 (tenant isolation).
    hidden = await client.get(
        f"/workspaces/{ws_id}/projects", headers=bearer(outsider)
    )
    assert hidden.status_code == 404

    # Admin can create; member can read.
    created = await client.post(
        f"/workspaces/{ws_id}/projects", json={"name": "P"}, headers=bearer(admin)
    )
    assert created.status_code == 201
    listed = await client.get(
        f"/workspaces/{ws_id}/projects", headers=bearer(member)
    )
    assert listed.status_code == 200
    assert len(listed.json()) == 1

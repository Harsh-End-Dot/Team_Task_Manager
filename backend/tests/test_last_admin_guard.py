"""Backend last-admin guard: a workspace must always keep at least one ADMIN.

The frontend already hides these actions, but the backend must enforce the
invariant so a direct API call (or two concurrent admins) can't orphan a
workspace. Demoting/removing an admin is fine as long as another admin remains.
"""
import uuid

from app.models.workspace import Membership, Role
from tests.helpers import bearer, me_id, register


async def _seed_membership(db_session, ws_id, user_id, role):
    db_session.add(
        Membership(
            workspace_id=uuid.UUID(ws_id),
            user_id=uuid.UUID(user_id),
            role=role,
        )
    )
    await db_session.commit()


async def _make_workspace(client, admin_token):
    return (
        await client.post("/workspaces", json={"name": "WS"}, headers=bearer(admin_token))
    ).json()["id"]


async def test_demote_last_admin_blocked(client):
    # Creator is the sole ADMIN; demoting them must be rejected with 409.
    admin = await register(client, "la-admin@x.com", name="Admin")
    admin_uid = await me_id(client, admin)
    ws_id = await _make_workspace(client, admin)

    resp = await client.patch(
        f"/workspaces/{ws_id}/members/{admin_uid}",
        json={"role": "MEMBER"},
        headers=bearer(admin),
    )
    assert resp.status_code == 409
    assert "admin" in resp.json()["detail"].lower()

    # Still an admin — the change did not take effect.
    members = (
        await client.get(f"/workspaces/{ws_id}/members", headers=bearer(admin))
    ).json()
    assert next(m for m in members if m["user_id"] == admin_uid)["role"] == "ADMIN"


async def test_remove_last_admin_blocked(client, db_session):
    admin = await register(client, "la-admin2@x.com", name="Admin")
    admin_uid = await me_id(client, admin)
    member = await register(client, "la-member2@x.com", name="Member")
    member_uid = await me_id(client, member)
    ws_id = await _make_workspace(client, admin)
    await _seed_membership(db_session, ws_id, member_uid, Role.MEMBER)

    # Removing the only admin is rejected (a lone MEMBER doesn't satisfy it).
    resp = await client.delete(
        f"/workspaces/{ws_id}/members/{admin_uid}", headers=bearer(admin)
    )
    assert resp.status_code == 409
    assert "admin" in resp.json()["detail"].lower()


async def test_demote_admin_when_another_admin_remains(client, db_session):
    admin = await register(client, "la-admin3@x.com", name="Admin")
    second = await register(client, "la-admin3b@x.com", name="Second")
    second_uid = await me_id(client, second)
    ws_id = await _make_workspace(client, admin)
    await _seed_membership(db_session, ws_id, second_uid, Role.ADMIN)

    # Two admins -> demoting one is allowed.
    resp = await client.patch(
        f"/workspaces/{ws_id}/members/{second_uid}",
        json={"role": "MEMBER"},
        headers=bearer(admin),
    )
    assert resp.status_code == 200
    assert resp.json()["role"] == "MEMBER"


async def test_remove_admin_when_another_admin_remains(client, db_session):
    admin = await register(client, "la-admin4@x.com", name="Admin")
    second = await register(client, "la-admin4b@x.com", name="Second")
    second_uid = await me_id(client, second)
    ws_id = await _make_workspace(client, admin)
    await _seed_membership(db_session, ws_id, second_uid, Role.ADMIN)

    # Two admins -> removing one is allowed.
    resp = await client.delete(
        f"/workspaces/{ws_id}/members/{second_uid}", headers=bearer(admin)
    )
    assert resp.status_code == 204

    # One admin remains.
    members = (
        await client.get(f"/workspaces/{ws_id}/members", headers=bearer(admin))
    ).json()
    assert sum(1 for m in members if m["role"] == "ADMIN") == 1

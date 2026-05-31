import uuid

from app.models.workspace import Membership, Role
from tests.helpers import bearer, me_id, register


async def test_list_members_includes_name_and_email(client, db_session):
    admin = await register(client, "admin@x.com", name="Admin User")
    member = await register(client, "member@x.com", name="Member User")
    member_uid = await me_id(client, member)

    ws_id = (
        await client.post("/workspaces", json={"name": "WS"}, headers=bearer(admin))
    ).json()["id"]

    db_session.add(
        Membership(
            workspace_id=uuid.UUID(ws_id),
            user_id=uuid.UUID(member_uid),
            role=Role.MEMBER,
        )
    )
    await db_session.commit()

    response = await client.get(f"/workspaces/{ws_id}/members", headers=bearer(admin))
    assert response.status_code == 200

    members = {m["user"]["email"]: m for m in response.json()}
    assert set(members) == {"admin@x.com", "member@x.com"}

    admin_member = members["admin@x.com"]
    assert admin_member["role"] == "ADMIN"
    assert admin_member["user"]["name"] == "Admin User"
    assert admin_member["user"]["id"] == admin_member["user_id"]

    assert members["member@x.com"]["role"] == "MEMBER"
    assert members["member@x.com"]["user"]["name"] == "Member User"


async def test_list_members_requires_membership(client):
    admin = await register(client, "owner@x.com", name="Owner")
    outsider = await register(client, "out@x.com", name="Outsider")

    ws_id = (
        await client.post("/workspaces", json={"name": "WS"}, headers=bearer(admin))
    ).json()["id"]

    blocked = await client.get(
        f"/workspaces/{ws_id}/members", headers=bearer(outsider)
    )
    assert blocked.status_code in (403, 404)

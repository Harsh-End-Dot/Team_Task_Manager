from tests.helpers import bearer, register


async def test_project_soft_delete_lifecycle(client):
    admin = await register(client, "admin@x.com")
    h = bearer(admin)
    ws_id = (
        await client.post("/workspaces", json={"name": "WS"}, headers=h)
    ).json()["id"]
    pid = (
        await client.post(
            f"/workspaces/{ws_id}/projects", json={"name": "P"}, headers=h
        )
    ).json()["id"]

    def ids(resp):
        return [p["id"] for p in resp.json()]

    # present in the normal list
    assert pid in ids(await client.get(f"/workspaces/{ws_id}/projects", headers=h))

    # soft delete -> 204
    deleted = await client.delete(f"/workspaces/{ws_id}/projects/{pid}", headers=h)
    assert deleted.status_code == 204

    # gone from the normal list
    assert pid not in ids(await client.get(f"/workspaces/{ws_id}/projects", headers=h))

    # but present in trash
    assert pid in ids(await client.get(f"/workspaces/{ws_id}/projects/trash", headers=h))

    # restore -> 200, deleted_at cleared
    restored = await client.post(
        f"/workspaces/{ws_id}/projects/{pid}/restore", headers=h
    )
    assert restored.status_code == 200
    assert restored.json()["deleted_at"] is None

    # back in the normal list, gone from trash
    assert pid in ids(await client.get(f"/workspaces/{ws_id}/projects", headers=h))
    assert pid not in ids(await client.get(f"/workspaces/{ws_id}/projects/trash", headers=h))

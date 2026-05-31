from tests.helpers import bearer, register


async def test_project_soft_delete_cascades_to_tasks(client):
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
    tid = (
        await client.post(f"/projects/{pid}/tasks", json={"title": "T"}, headers=h)
    ).json()["id"]

    # Task visible while the project is active.
    assert (await client.get(f"/tasks/{tid}", headers=h)).status_code == 200

    # Soft-delete the project -> its tasks vanish (read-time cascade).
    assert (
        await client.delete(f"/workspaces/{ws_id}/projects/{pid}", headers=h)
    ).status_code == 204
    assert (await client.get(f"/tasks/{tid}", headers=h)).status_code == 404
    assert (await client.get(f"/projects/{pid}/tasks", headers=h)).status_code == 404

    # Restore the project -> the task reappears.
    assert (
        await client.post(f"/workspaces/{ws_id}/projects/{pid}/restore", headers=h)
    ).status_code == 200
    assert (await client.get(f"/tasks/{tid}", headers=h)).status_code == 200

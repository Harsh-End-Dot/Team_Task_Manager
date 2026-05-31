from tests.helpers import bearer, login, signup


async def test_signup_login_me(client):
    resp = await signup(client, "alice@x.com", name="Alice")
    assert resp.status_code == 201
    body = resp.json()
    assert body["email"] == "alice@x.com"
    assert "hashed_password" not in body  # never leak the hash

    # duplicate email -> 409
    dup = await signup(client, "alice@x.com")
    assert dup.status_code == 409

    token = await login(client, "alice@x.com")
    me = await client.get("/auth/me", headers=bearer(token))
    assert me.status_code == 200
    assert me.json()["email"] == "alice@x.com"


async def test_me_requires_auth(client):
    resp = await client.get("/auth/me")
    assert resp.status_code in (401, 403)


async def test_login_wrong_password(client):
    await signup(client, "bob@x.com")
    resp = await client.post(
        "/auth/login", json={"email": "bob@x.com", "password": "wrong-password"}
    )
    assert resp.status_code == 401


async def test_update_profile_name_and_email(client):
    await signup(client, "carol@x.com", name="Carol")
    token = await login(client, "carol@x.com")

    resp = await client.patch(
        "/auth/me",
        json={"name": "Caroline", "email": "caroline@x.com"},
        headers=bearer(token),
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["name"] == "Caroline"
    assert body["email"] == "caroline@x.com"

    # The new email is now the login handle.
    new_token = await login(client, "caroline@x.com")
    me = await client.get("/auth/me", headers=bearer(new_token))
    assert me.json()["name"] == "Caroline"


async def test_update_profile_duplicate_email_conflicts(client):
    await signup(client, "dave@x.com", name="Dave")
    await signup(client, "erin@x.com", name="Erin")
    token = await login(client, "dave@x.com")

    # Changing to an email another user already owns -> 409.
    resp = await client.patch(
        "/auth/me", json={"email": "erin@x.com"}, headers=bearer(token)
    )
    assert resp.status_code == 409


async def test_update_profile_requires_auth(client):
    resp = await client.patch("/auth/me", json={"name": "Nope"})
    assert resp.status_code in (401, 403)

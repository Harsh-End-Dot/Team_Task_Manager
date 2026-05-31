DEFAULT_PASSWORD = "Secret12345"


async def signup(client, email, password=DEFAULT_PASSWORD, name="User"):
    return await client.post(
        "/auth/signup", json={"email": email, "password": password, "name": name}
    )


async def login(client, email, password=DEFAULT_PASSWORD):
    resp = await client.post(
        "/auth/login", json={"email": email, "password": password}
    )
    return resp.json()["access_token"]


async def register(client, email, name="User"):
    """Sign up then log in; returns the access token."""
    await signup(client, email, name=name)
    return await login(client, email)


def bearer(token):
    return {"Authorization": f"Bearer {token}"}


async def me_id(client, token):
    resp = await client.get("/auth/me", headers=bearer(token))
    return resp.json()["id"]

"""Rate limiting + pending-cap on the invitation endpoint.

Rate limiting is disabled suite-wide (see conftest), so the rate-limit test
toggles the limiter on for itself and restores it afterward. The pending-cap is
a business rule that applies regardless of the time-window limiter.
"""

from app.core.config import settings
from app.core.rate_limit import limiter
from tests.helpers import bearer, register


async def _make_workspace(client, email):
    admin = await register(client, email, name="Admin")
    ws_id = (
        await client.post("/workspaces", json={"name": "WS"}, headers=bearer(admin))
    ).json()["id"]
    return admin, ws_id


async def _invite(client, token, ws_id, email, role="MEMBER"):
    return await client.post(
        f"/workspaces/{ws_id}/invitations",
        json={"email": email, "role": role},
        headers=bearer(token),
    )


async def test_invitation_pending_cap_returns_429(client, monkeypatch):
    # Shrink the cap so the test stays fast (3 instead of 20).
    monkeypatch.setattr(settings, "MAX_PENDING_INVITATIONS_PER_WORKSPACE", 3)
    admin, ws_id = await _make_workspace(client, "cap-admin@x.com")

    for i in range(3):
        resp = await _invite(client, admin, ws_id, f"invitee{i}@x.com")
        assert resp.status_code == 201, resp.text

    # The 4th exceeds the cap.
    over = await _invite(client, admin, ws_id, "invitee-over@x.com")
    assert over.status_code == 429
    assert "pending" in over.json()["detail"].lower()


async def test_invitation_rate_limit_returns_429(client, monkeypatch):
    monkeypatch.setattr(settings, "RATE_LIMIT_INVITATION", "2/minute")
    limiter.enabled = True
    limiter.reset()
    try:
        admin, ws_id = await _make_workspace(client, "rl-admin@x.com")

        assert (await _invite(client, admin, ws_id, "a@x.com")).status_code == 201
        assert (await _invite(client, admin, ws_id, "b@x.com")).status_code == 201

        blocked = await _invite(client, admin, ws_id, "c@x.com")
        assert blocked.status_code == 429
        assert "rate limit" in blocked.json()["detail"].lower()
    finally:
        limiter.reset()
        limiter.enabled = False

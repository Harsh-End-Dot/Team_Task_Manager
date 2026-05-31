import json
import logging
import urllib.request

from app.core.config import settings

logger = logging.getLogger(__name__)

RESEND_URL = "https://api.resend.com/emails"
SENDGRID_URL = "https://api.sendgrid.com/v3/mail/send"
_TIMEOUT = 10


def send_email(
    to: str, subject: str, *, text: str | None = None, html: str | None = None
) -> None:
    """Send an email, best-effort and config-gated.

    If no EMAIL_API_KEY is configured, the email is logged instead of sent so
    the app runs in dev / on machines without email set up. Any send failure is
    caught and logged — this function never raises (it runs in a background
    task and must not break the triggering request).
    """
    if not settings.EMAIL_API_KEY:
        logger.warning(
            "[email stub] to=%s | subject=%s | body=%s", to, subject, html or text
        )
        return

    provider = settings.EMAIL_PROVIDER.lower()
    try:
        if provider == "resend":
            _send_via_resend(to, subject, text, html)
        elif provider == "sendgrid":
            _send_via_sendgrid(to, subject, text, html)
        else:
            logger.warning(
                "[email] unknown EMAIL_PROVIDER '%s'; not sent to %s", provider, to
            )
            return
        logger.info("email sent to %s via %s", to, provider)
    except Exception:
        logger.warning(
            "[email] send to %s via %s failed (best-effort)", to, provider, exc_info=True
        )


def _post_json(url: str, payload: dict, headers: dict) -> None:
    request = urllib.request.Request(
        url, data=json.dumps(payload).encode(), method="POST", headers=headers
    )
    with urllib.request.urlopen(request, timeout=_TIMEOUT) as response:
        response.read()


def _send_via_resend(
    to: str, subject: str, text: str | None, html: str | None
) -> None:
    payload: dict = {"from": settings.EMAIL_FROM, "to": [to], "subject": subject}
    if html:
        payload["html"] = html
    if text:
        payload["text"] = text
    _post_json(
        RESEND_URL,
        payload,
        {
            "Authorization": f"Bearer {settings.EMAIL_API_KEY}",
            "Content-Type": "application/json",
        },
    )


def _send_via_sendgrid(
    to: str, subject: str, text: str | None, html: str | None
) -> None:
    content = []
    if text:
        content.append({"type": "text/plain", "value": text})
    if html:
        content.append({"type": "text/html", "value": html})
    if not content:
        content = [{"type": "text/plain", "value": ""}]
    payload = {
        "personalizations": [{"to": [{"email": to}]}],
        "from": {"email": settings.EMAIL_FROM},
        "subject": subject,
        "content": content,
    }
    _post_json(
        SENDGRID_URL,
        payload,
        {
            "Authorization": f"Bearer {settings.EMAIL_API_KEY}",
            "Content-Type": "application/json",
        },
    )

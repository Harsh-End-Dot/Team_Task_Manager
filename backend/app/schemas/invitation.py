import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr

from app.models.workspace import Role


class InvitationCreate(BaseModel):
    email: EmailStr
    role: Role = Role.MEMBER


class InvitationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    workspace_id: uuid.UUID
    email: EmailStr
    role: Role
    # Exposed so admins can copy/share the join link directly when email delivery
    # isn't configured. Both invitation endpoints that return this are admin-only.
    token: str
    expires_at: datetime
    accepted_at: datetime | None
    created_at: datetime


class InvitationAccept(BaseModel):
    token: str

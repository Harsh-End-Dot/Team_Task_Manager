import uuid

from pydantic import BaseModel, ConfigDict, Field


class LabelCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    color: str = Field(min_length=1, max_length=32)


class LabelUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    color: str | None = Field(default=None, min_length=1, max_length=32)


class LabelResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    workspace_id: uuid.UUID
    name: str
    color: str

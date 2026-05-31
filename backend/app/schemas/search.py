from pydantic import BaseModel

from app.schemas.dashboard import TaskSummary
from app.schemas.project import ProjectResponse


class SearchResponse(BaseModel):
    projects: list[ProjectResponse]
    tasks: list[TaskSummary]

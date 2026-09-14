from __future__ import annotations

from datetime import date, datetime
from enum import Enum

from pydantic import BaseModel, Field


class TaskStatus(str, Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    BLOCKED = "blocked"
    DONE = "done"


class Priority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Task(BaseModel):
    task_id: str
    title: str
    owner: str
    status: TaskStatus
    priority: Priority = Priority.MEDIUM
    due_date: date
    progress: int = Field(ge=0, le=100)
    dependencies: list[str] = Field(default_factory=list)
    latest_update: str = ""
    last_updated_at: datetime


class Project(BaseModel):
    project_id: str
    name: str
    release_date: date
    tasks: list[Task]


class TaskRisk(BaseModel):
    task_id: str
    score: int = Field(ge=0, le=100)
    factors: list[str]
    downstream_task_ids: list[str]
    suggested_question: str | None = None


class ProjectRisk(BaseModel):
    project_id: str
    release_risk_score: int = Field(ge=0, le=100)
    release_health: str
    summary: str
    at_risk_tasks: list[TaskRisk]

from fastapi import FastAPI

from models import Project, ProjectRisk
from risk_engine import assess_project

app = FastAPI(title="Reroute API", version="0.1.0")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/projects/assess", response_model=ProjectRisk)
def assess(project: Project) -> ProjectRisk:
    """Analyze a project's task data and return transparent delivery risks."""
    return assess_project(project)

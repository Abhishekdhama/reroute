from fastapi import FastAPI

from models import Project, ProjectRisk, Reassessment, UnblockReply
from risk_engine import assess_project

app = FastAPI(title="Reroute API", version="0.1.0")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/projects/assess", response_model=ProjectRisk)
def assess(project: Project) -> ProjectRisk:
    """Analyze a project's task data and return transparent delivery risks."""
    return assess_project(project)


@app.post("/api/projects/reassess-after-reply", response_model=Reassessment)
def reassess_after_reply(project: Project, reply: UnblockReply) -> Reassessment:
    """Apply a task-owner reply and return the updated plan risk.

    This endpoint is intentionally stateless for the MVP: the frontend sends the
    current project workspace, making it easy to demo without auth or a database.
    """
    found = False
    updated_tasks = []
    for task in project.tasks:
        if task.task_id != reply.task_id:
            updated_tasks.append(task)
            continue
        found = True
        updated_tasks.append(
            task.model_copy(
                update={
                    "status": reply.new_status,
                    "due_date": reply.revised_due_date or task.due_date,
                    "progress": reply.progress if reply.progress is not None else task.progress,
                    "latest_update": reply.update,
                    "last_updated_at": reply.responded_at,
                }
            )
        )

    if not found:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail=f"Task '{reply.task_id}' was not found")

    updated_project = project.model_copy(update={"tasks": updated_tasks})
    return Reassessment(project=updated_project, risk=assess_project(updated_project))

"""Transparent project-risk scoring for Reroute.

The engine intentionally separates deterministic signals from the AI layer. An LLM
may extract a blocker from an update, but every displayed score has clear reasons.
"""

from __future__ import annotations

from datetime import date, datetime, timezone

import networkx as nx

from models import Project, ProjectRisk, Task, TaskRisk, TaskStatus


PRIORITY_WEIGHT = {"low": 3, "medium": 6, "high": 10, "critical": 15}


def _days_until(target: date, today: date) -> int:
    return (target - today).days


def build_dependency_graph(project: Project) -> nx.DiGraph:
    """Return a graph directed from prerequisite to dependent task."""
    graph = nx.DiGraph()
    task_ids = {task.task_id for task in project.tasks}
    for task in project.tasks:
        graph.add_node(task.task_id)
        for dependency_id in task.dependencies:
            if dependency_id in task_ids:
                graph.add_edge(dependency_id, task.task_id)
    return graph


def blast_radius(graph: nx.DiGraph, task_id: str) -> list[str]:
    return sorted(nx.descendants(graph, task_id))


def _question_for(task: Task, radius: list[str]) -> str | None:
    if task.status != TaskStatus.BLOCKED:
        return None
    impact = f" It is blocking {len(radius)} downstream task(s)." if radius else ""
    return (
        f"Hi {task.owner}, what specifically is needed to unblock “{task.title}”, "
        f"who can provide it, and what is your best revised completion date?{impact}"
    )


def _intervention_for(task: Task, radius: list[str], days_to_due: int) -> str:
    """Recommend an action a project lead can take today, not a vague warning."""
    impact = f" to protect {len(radius)} dependent task(s)" if radius else ""
    if task.status == TaskStatus.BLOCKED:
        return (
            f"Assign a same-day unblock owner for “{task.title}” and confirm a revised ETA"
            f"{impact}."
        )
    if days_to_due < 0:
        return (
            f"Escalate “{task.title}” today; either add support or move its dependent work"
            f" to a safe alternative path{impact}."
        )
    if task.status == TaskStatus.TODO and days_to_due <= 2:
        return f"Start “{task.title}” today or explicitly reassign it{impact}."
    if task.progress < 40 and days_to_due <= 3:
        return f"Split “{task.title}” into a shippable minimum and defer nonessential scope{impact}."
    return f"Request a concrete status update and ETA for “{task.title}” today{impact}."


def score_task(task: Task, graph: nx.DiGraph, today: date, now: datetime) -> TaskRisk:
    score = 0
    factors: list[str] = []
    days_to_due = _days_until(task.due_date, today)
    radius = blast_radius(graph, task.task_id)

    if task.status == TaskStatus.BLOCKED:
        score += 35
        factors.append("Task is explicitly blocked")
    elif task.status == TaskStatus.IN_PROGRESS and days_to_due <= 1:
        score += 18
        factors.append("In progress with less than two days until its due date")
    elif task.status == TaskStatus.TODO and days_to_due <= 2:
        score += 15
        factors.append("Not started and due within two days")

    if days_to_due < 0 and task.status != TaskStatus.DONE:
        score += 25
        factors.append(f"Overdue by {abs(days_to_due)} day(s)")
    elif days_to_due <= 1 and task.status != TaskStatus.DONE:
        score += 12
        factors.append("Due within one day")

    update_age_days = max(0, (now - task.last_updated_at).total_seconds() / 86400)
    if task.status != TaskStatus.DONE and update_age_days >= 2:
        score += min(15, int(update_age_days) * 4)
        factors.append(f"No update for {int(update_age_days)} day(s)")

    if radius:
        exposure = min(20, len(radius) * 5)
        score += exposure
        factors.append(f"Blocks {len(radius)} downstream task(s)")

    score += PRIORITY_WEIGHT[task.priority.value]
    if task.priority.value in {"high", "critical"}:
        factors.append(f"{task.priority.value.title()} priority")

    if task.progress < 40 and days_to_due <= 3 and task.status != TaskStatus.DONE:
        score += 10
        factors.append("Low progress close to deadline")

    return TaskRisk(
        task_id=task.task_id,
        score=min(100, score),
        factors=factors,
        downstream_task_ids=radius,
        suggested_question=_question_for(task, radius),
        recommended_intervention=_intervention_for(task, radius, days_to_due),
    )


def assess_project(project: Project, today: date | None = None, now: datetime | None = None) -> ProjectRisk:
    today = today or date.today()
    now = now or datetime.now(timezone.utc)
    graph = build_dependency_graph(project)
    risks = [score_task(task, graph, today, now) for task in project.tasks if task.status != TaskStatus.DONE]
    at_risk = sorted((risk for risk in risks if risk.score >= 25), key=lambda risk: risk.score, reverse=True)

    if not at_risk:
        score, health = 5, "on_track"
        summary = "No material delivery risks detected."
    else:
        top = at_risk[0]
        score = min(100, round(top.score * 0.65 + min(35, len(at_risk) * 6)))
        health = "critical" if score >= 70 else "at_risk" if score >= 40 else "watch"
        summary = f"{len(at_risk)} task(s) need attention. Highest risk: {top.task_id} (score {top.score})."

    return ProjectRisk(
        project_id=project.project_id,
        release_risk_score=score,
        release_health=health,
        summary=summary,
        at_risk_tasks=at_risk,
    )

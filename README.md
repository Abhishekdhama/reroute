# Reroute

**Spot delivery risks. Unblock work. Reroute the plan.**

Reroute is an AI delivery-rescue agent for project leads. It analyzes task status, dependencies, deadlines, and updates to explain delivery risk, identify the blast radius, and propose the smallest intervention to recover a plan.

## Team work areas

| Area | Owner |
| --- | --- |
| `backend/risk_engine.py` and dependency analysis | Team lead |
| Backend API, agent workflow, integration | Codex + team lead |
| `frontend/` UI and graph experience | Ishank |
| `backend/csv_import.py`, models, seed data | Kanchan |
| `docs/`, QA, presentation, video | Muskan |

## Initial data contract

Each task includes: `task_id`, `title`, `owner`, `status`, `priority`, `due_date`, `progress`, `dependencies`, `latest_update`, and `last_updated_at`.

## Local setup

Setup instructions will be added as the FastAPI backend and Next.js frontend are initialized.

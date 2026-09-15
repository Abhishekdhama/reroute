# Reroute

**Reroute is an AI delivery-rescue agent for project leads. It turns messy task data into explainable risk, dependency blast radius, and concrete interventions.**

Built for the [AI Builders Hackathon 2026](https://ai-builders-hackathon-2026.devpost.com/).

## Problem

Project leads running a release don't lack data - they lack synthesis. Status lives scattered across a task tracker: who's blocked, what's overdue, what depends on what. Nothing connects those dots, so risk is discovered late, dependencies are invisible until something breaks, and "what happens if this slips?" only gets answered after it already has. Most PM tools show you status. None of them tell you what's actually in danger, why, or what to do about it in the next five minutes.

## What Reroute Does

Reroute takes a task export, assesses it, and hands a project lead three things a status board never does: a transparent risk score per task with the plain-English reasons behind it, the full blast radius of every at-risk task (what breaks downstream if it slips), and the smallest concrete intervention to protect the release - not a generic "this is risky" warning. When an owner responds with an update, Reroute re-runs the assessment and shows an honest before/after: what got better, what's still flagged, what's new.

## How It Works

1. **Ingest**  upload a task CSV (or use the seeded demo project). The backend parses it into typed `Task`/`Project` records, tolerating two column layouts and reporting bad rows instead of failing the whole file.
2. **Score** - a deterministic risk engine builds the dependency graph (NetworkX) and scores every task 0–100 from concrete signals: blocked status, overdue days, staleness, priority, downstream exposure, and low progress near a deadline. Every score ships with the factors that produced it.
3. **Trace** - for each at-risk task, the engine computes its full blast radius (every downstream task reachable through the dependency graph) and a plain-language recommended intervention.
4. **Understand** - an optional LLM layer (Gemini) can extract structured signal - is this actually blocked, on what, and what question would unblock it - from a messy free-text update, falling back to deterministic keyword rules when no API key is configured. It never fails silently.
5. **Present** - the frontend renders Overview, Risks, a dependency graph, Tasks, and Activity entirely from what the backend returns. No score, factor, or recommendation is ever recomputed client-side.
6. **Reassess** - the lead records what an owner actually said (new status, revised date, a note), the backend re-scores the plan, and the UI shows the release moving or not with the reasons why.

## Key Features

- **CSV project ingestion** - real-export dates or relative demo dates, auto-detected; per-row errors reported instead of an all-or-nothing failure
- **Delivery risk detection** - a transparent 0-100 score per task with the factors behind it, never a black-box number
- **Dependency / blast-radius analysis** - the full dependency graph, the critical path, and exactly what breaks if a given task slips
- **AI-assisted blocker understanding** - optional LLM extraction of blocker reason and a drafted unblock question from free-text updates, with a rule-based fallback when no API key is set
- **Recommended intervention** - the smallest next action that protects the release, not a vague alert
- **Human-in-the-loop reassessment** - record the owner's real reply, re-run the engine, see the plan's risk honestly move

## Demo Flow

1. Open the app - the seeded project **Payments Release 4.2** is already assessed: **Critical, 95/100**.
2. Overview leads with the one sentence that matters: *Payment Service API is blocked, overdue by 1 day, and blocks 9 downstream tasks.*
3. Open **Risks** - see the full reasoning, the blast radius broken into direct / indirect / critical-path counts, and the recommended intervention with a drafted question ready to send to the owner.
4. Open **Dependencies** - click the blocked task and watch its downstream blast radius highlight across the graph.
5. Click **Ask Priya**, record her reply (*credentials arrived, shipping Thursday*), hit **Reassess** - release risk drops and the factor list updates live, with nothing fabricated.
6. Optionally: go to **Settings -> Upload CSV** and drop in a real task export - the same pipeline runs on it immediately.

## Architecture

Two independent services, cleanly separated by responsibility. The backend is the sole source of truth for every score, factor, and recommendation; the frontend is presentation and interaction only. The backend ships without CORS, so the browser never calls it directly - every request is proxied server-side through the frontend's own API routes, and the backend itself is stateless: the caller sends the full project on every request, so there's no database to stand up for the demo.

```
Browser (Next.js UI)
   │  fetch("/api/...")              same-origin, no CORS needed
   ▼
Next.js route handlers (server)      frontend/src/app/api/*/route.ts
   │  fetch(REROUTE_API_URL + ...)   server-to-server
   ▼
FastAPI backend
   ├─ risk_engine.py    deterministic scoring + blast radius
   ├─ csv_import.py     CSV -> typed Project/Task
   └─ agent.py          optional LLM blocker extraction (Gemini, with fallback)
```

## Tech Stack

**Backend** - Python 3.13, FastAPI 0.115, Pydantic 2.10, NetworkX 3.4, Uvicorn; optional `google-generativeai` (Gemini 1.5 Flash) for blocker extraction.

**Frontend** - Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS v4, ESLint 9.

## Project Structure

```
reroute/
├── backend/
│   ├── main.py           FastAPI app and routes
│   ├── models.py         Task / Project / risk / reassessment schemas
│   ├── risk_engine.py    scoring, blast radius, interventions
│   ├── csv_import.py     CSV → Project parsing
│   ├── agent.py          LLM-assisted blocker extraction (optional)
│   ├── seed_data/        demo project CSV
│   └── test_*.py         risk engine + CSV import tests
└── frontend/
    ├── src/app/          routes: overview, risks, dependencies, tasks, activity, settings
    ├── src/app/api/      server-side proxy to the backend
    ├── src/components/   layout, dashboard, risks, tasks, graph, ui
    ├── src/lib/          API client, risk-to-view derivation, graph layout, CSV parsing
    └── src/types/        shared data contract
```

See [`frontend/README.md`](frontend/README.md) for frontend-specific detail.

## Local Setup

```bash
# backend
cd backend
pip install -r requirements.txt

# frontend
cd frontend
npm install
```

## Environment Variables

| Variable | Where | Required | Purpose |
| --- | --- | --- | --- |
| `GEMINI_API_KEY` | backend | No | Enables LLM-based blocker extraction in `agent.py`; without it, a deterministic keyword fallback is used |
| `REROUTE_API_URL` | frontend | No | Backend base URL for the frontend's server-side proxy; defaults to `http://127.0.0.1:8000` (see `frontend/.env.example`) |

## Running the Application

```bash
# 1. risk engine - http://127.0.0.1:8000
cd backend
uvicorn main:app --reload

# 2. frontend - http://localhost:3000
cd frontend
npm run dev
```

## API Endpoints

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/health` | Service liveness check |
| `POST` | `/api/projects/assess` | Assess a `Project` and return its `ProjectRisk` |
| `POST` | `/api/projects/upload` | Parse an uploaded CSV and return the assessed `ProjectRisk` |
| `POST` | `/api/projects/reassess-after-reply` | Apply an owner's reply to one task and return the updated `Project` + `ProjectRisk` |

Interactive docs are served at `/docs` once the backend is running.

## Team

| Area | Owner |
| --- | --- |
| Risk engine, dependency analysis, backend API, agent workflow | Abhishek Dhama |
| `frontend/` UI and graph experience | Ishank |
| CSV import, data models, seed data | Kanchan |
| Docs, QA, presentation, video | Muskan |

## Hackathon

Built for the [AI Builders Hackathon 2026](https://ai-builders-hackathon-2026.devpost.com/). Reroute's bet: an AI product for project delivery earns trust by being explainable first - every number on screen traces back to a stated reason, and the AI layer enriches that reasoning instead of replacing it.

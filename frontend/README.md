# Reroute — frontend

Next.js app for Reroute's delivery-rescue workflow: read release health, understand
why a task is at risk, see the blast radius, and reroute the plan.

## Running it

The frontend is a presentation layer. Every risk score, risk factor, blast radius,
recommended intervention and reassessment comes from the FastAPI service in `../backend`.

```bash
# 1. risk engine
cd ../backend
pip install -r requirements.txt
uvicorn main:app --reload           # http://127.0.0.1:8000

# 2. frontend
cd ../frontend
npm install
npm run dev                         # http://localhost:3000
```

Point the app at a different API host with `REROUTE_API_URL` (see `.env.example`).

## How it talks to the backend

The FastAPI app ships without CORS middleware, so the browser never calls it directly.
Route handlers in `src/app/api` proxy server-to-server:

| Frontend route | Backend endpoint |
| --- | --- |
| `POST /api/assess` | `POST /api/projects/assess` |
| `POST /api/reassess` | `POST /api/projects/reassess-after-reply` |
| `GET /api/health` | `GET /health` |

The backend is stateless, so the browser owns the project workspace and posts it with
every request. `WorkspaceProvider` (`src/lib/workspace.tsx`) holds that workspace, the
latest `ProjectRisk`, and the reassessment history for the session.

When the API is unreachable the app shows an error state naming the endpoint and status
rather than falling back to invented numbers.

## Layout

```
src/
  app/            routes (overview, risks, dependencies, tasks, activity, settings) + API proxy
  components/
    layout/       app shell, sidebar, command palette, detail drawer, workspace gate
    dashboard/    release health, signal strip, critical path, next action
    risks/        risk rows, blast radius, intervention, reassessment dialog, risk delta
    tasks/        task table, task detail panel, shared task metadata
    graph/        dependency graph canvas, nodes, legend
    ui/           buttons, badges, panels, dialog, fields, feedback states
  lib/            api client, derivation, graph analysis, layout, seed workspace, formatting
  types/          the backend data contract
```

`src/lib/derive.ts` is the single place where a `Project` plus a `ProjectRisk` become the
view model the screens render. Graph traversal (`src/lib/graph.ts`) and layout
(`src/lib/graph-layout.ts`) are presentation concerns only — no scoring happens here.

## Demo workspace

`src/lib/seed.ts` builds a realistic 14-task payments release relative to today, so the
engine scores it against the real calendar instead of stale fixed dates. The story it
tells: *Payment service API* is blocked and overdue with nine tasks downstream; recording
the owner's reply drops the release from **Critical** to **At risk** and promotes the next
blocker. Reset it from Settings.

## Checks

```bash
npx tsc --noEmit
npx eslint src
npm run build
```

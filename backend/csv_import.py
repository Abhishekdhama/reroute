"""CSV importer for Reroute.

Turns a task-tracker export (Jira/Linear/Sheets CSV, or Reroute's own seed file)
into the `Project` / `Task` pydantic models the risk engine already understands.

Two column layouts are supported, auto-detected from the header row:

1. Absolute dates (real-world exports)
   task_id,title,owner,status,priority,due_date,progress,dependencies,latest_update,last_updated_at
   - due_date: YYYY-MM-DD
   - last_updated_at: ISO 8601 datetime (``2026-09-14T10:00:00+00:00``)

2. Relative dates (demo/seed data that should never go stale)
   task_id,title,owner,status,priority,due_in_days,progress,dependencies,latest_update,updated_hours_ago
   - due_in_days: signed int, offset from "today" (negative = overdue)
   - updated_hours_ago: unsigned int/float, offset from "now"

In both layouts:
   - dependencies: task_ids separated by ``;`` or ``,`` inside the cell (empty = none)
   - progress: integer 0-100

Errors are collected per-row rather than raising on the first bad line, so a
caller (CLI or future upload endpoint) can report "12 of 14 tasks imported"
instead of failing the whole file over one typo.
"""

from __future__ import annotations

import argparse
import csv
import json
import sys
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Iterable, TextIO

from pydantic import ValidationError

from models import Priority, Project, Task, TaskStatus

REQUIRED_BASE_COLUMNS = {
    "task_id",
    "title",
    "owner",
    "status",
    "priority",
    "progress",
    "dependencies",
    "latest_update",
}
ABSOLUTE_DATE_COLUMNS = {"due_date", "last_updated_at"}
RELATIVE_DATE_COLUMNS = {"due_in_days", "updated_hours_ago"}

SEED_CSV_PATH = Path(__file__).parent / "seed_data" / "launch_project.csv"
SEED_PROJECT_ID = "payments-4-2"
SEED_PROJECT_NAME = "Payments Release 4.2"
SEED_RELEASE_OFFSET_DAYS = 12


@dataclass
class RowError:
    row_number: int  # 1-indexed, matches spreadsheet row incl. header
    task_id: str | None
    message: str

    def __str__(self) -> str:  # pragma: no cover - trivial
        who = self.task_id or "<unknown task_id>"
        return f"row {self.row_number} ({who}): {self.message}"


@dataclass
class ImportResult:
    tasks: list[Task]
    errors: list[RowError] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)

    @property
    def ok(self) -> bool:
        return not self.errors


class CSVImportError(ValueError):
    """Raised when the file itself is unusable (bad header, empty file, ...)."""


def _split_dependencies(raw: str) -> list[str]:
    if not raw or not raw.strip():
        return []
    parts = raw.replace(";", ",").split(",")
    return [p.strip() for p in parts if p.strip()]


def _detect_mode(fieldnames: Iterable[str]) -> str:
    fields = set(fieldnames)
    missing_base = REQUIRED_BASE_COLUMNS - fields
    if missing_base:
        raise CSVImportError(
            f"CSV is missing required column(s): {', '.join(sorted(missing_base))}"
        )
    if ABSOLUTE_DATE_COLUMNS <= fields:
        return "absolute"
    if RELATIVE_DATE_COLUMNS <= fields:
        return "relative"
    raise CSVImportError(
        "CSV must include either 'due_date' + 'last_updated_at' "
        "(absolute) or 'due_in_days' + 'updated_hours_ago' (relative) columns."
    )


def _parse_row(
    row: dict[str, str],
    row_number: int,
    mode: str,
    today: date,
    now: datetime,
) -> Task:
    task_id = (row.get("task_id") or "").strip()
    if not task_id:
        raise ValueError("task_id is required")

    if mode == "absolute":
        due_date = date.fromisoformat(row["due_date"].strip())
        last_updated_raw = row["last_updated_at"].strip().replace("Z", "+00:00")
        last_updated_at = datetime.fromisoformat(last_updated_raw)
        if last_updated_at.tzinfo is None:
            last_updated_at = last_updated_at.replace(tzinfo=timezone.utc)
    else:
        due_in_days = int(row["due_in_days"])
        due_date = today + timedelta(days=due_in_days)
        hours_ago = float(row["updated_hours_ago"])
        last_updated_at = now - timedelta(hours=hours_ago)

    progress_raw = row["progress"].strip()
    progress = int(float(progress_raw)) if progress_raw else 0

    return Task(
        task_id=task_id,
        title=row["title"].strip(),
        owner=row["owner"].strip(),
        status=TaskStatus(row["status"].strip().lower()),
        priority=Priority(row.get("priority", "medium").strip().lower() or "medium"),
        due_date=due_date,
        progress=progress,
        dependencies=_split_dependencies(row.get("dependencies", "")),
        latest_update=row.get("latest_update", "").strip(),
        last_updated_at=last_updated_at,
    )


def import_tasks(
    source: TextIO,
    *,
    today: date | None = None,
    now: datetime | None = None,
) -> ImportResult:
    """Parse an open CSV file-like object into tasks, collecting row-level errors."""
    today = today or date.today()
    now = now or datetime.now(timezone.utc)

    reader = csv.DictReader(source)
    if reader.fieldnames is None:
        raise CSVImportError("CSV file is empty")
    mode = _detect_mode(reader.fieldnames)

    tasks: list[Task] = []
    errors: list[RowError] = []
    seen_ids: set[str] = set()

    for row_number, row in enumerate(reader, start=2):  # header is row 1
        raw_task_id = (row.get("task_id") or "").strip() or None
        try:
            task = _parse_row(row, row_number, mode, today, now)
        except (ValueError, ValidationError) as exc:
            errors.append(RowError(row_number, raw_task_id, _flatten_error(exc)))
            continue

        if task.task_id in seen_ids:
            errors.append(
                RowError(row_number, task.task_id, "duplicate task_id in file")
            )
            continue

        seen_ids.add(task.task_id)
        tasks.append(task)

    warnings = _check_dependency_integrity(tasks)
    return ImportResult(tasks=tasks, errors=errors, warnings=warnings)


def _flatten_error(exc: Exception) -> str:
    if isinstance(exc, ValidationError):
        first = exc.errors()[0]
        loc = ".".join(str(p) for p in first["loc"])
        return f"{loc}: {first['msg']}"
    return str(exc)


def _check_dependency_integrity(tasks: list[Task]) -> list[str]:
    known_ids = {t.task_id for t in tasks}
    warnings: list[str] = []
    for task in tasks:
        for dep in task.dependencies:
            if dep not in known_ids:
                warnings.append(
                    f"{task.task_id} depends on '{dep}', which is not in this file "
                    "(will be ignored by the risk engine)"
                )
    return warnings


def build_project_from_csv(
    path: str | Path,
    *,
    project_id: str,
    name: str,
    release_date: date,
    today: date | None = None,
    now: datetime | None = None,
) -> tuple[Project, ImportResult]:
    """Read a CSV file on disk and return a Project plus the import report.

    Raises CSVImportError if the file has no valid rows; otherwise returns
    whatever tasks parsed cleanly, alongside the per-row errors for the rest.
    """
    with open(path, newline="", encoding="utf-8") as f:
        result = import_tasks(f, today=today, now=now)

    if not result.tasks:
        detail = "; ".join(str(e) for e in result.errors) or "no data rows"
        raise CSVImportError(f"No importable tasks found in {path} ({detail})")

    project = Project(
        project_id=project_id,
        name=name,
        release_date=release_date,
        tasks=result.tasks,
    )
    return project, result


def load_seed_project(now: datetime | None = None) -> Project:
    """Build Reroute's canonical demo project (the same story as the frontend's
    seed workspace: a 14-task payments release, blocked on a stalled API).

    Dates are relative to `now`, so the demo always scores sensibly regardless
    of when it's actually run.
    """
    now = now or datetime.now(timezone.utc)
    today = now.date()
    project, result = build_project_from_csv(
        SEED_CSV_PATH,
        project_id=SEED_PROJECT_ID,
        name=SEED_PROJECT_NAME,
        release_date=today + timedelta(days=SEED_RELEASE_OFFSET_DAYS),
        today=today,
        now=now,
    )
    if not result.ok:
        raise CSVImportError(
            "Seed CSV has errors: " + "; ".join(str(e) for e in result.errors)
        )
    return project


def _cli() -> None:
    parser = argparse.ArgumentParser(description="Import a task CSV into a Reroute Project.")
    parser.add_argument("csv_path", nargs="?", help="Path to the CSV file")
    parser.add_argument("--project-id", default="imported-project")
    parser.add_argument("--name", default="Imported Project")
    parser.add_argument(
        "--release-date",
        help="YYYY-MM-DD (defaults to 14 days from today)",
    )
    parser.add_argument(
        "--seed",
        action="store_true",
        help="Ignore csv_path and load the built-in demo project instead",
    )
    parser.add_argument(
        "--assess",
        action="store_true",
        help="Run the risk engine on the imported project and print the result",
    )
    parser.add_argument("--out", help="Write the Project JSON to this file instead of stdout")
    args = parser.parse_args()

    if args.seed:
        project = load_seed_project()
    else:
        if not args.csv_path:
            parser.error("csv_path is required unless --seed is passed")
        release_date = (
            date.fromisoformat(args.release_date)
            if args.release_date
            else date.today() + timedelta(days=14)
        )
        project, result = build_project_from_csv(
            args.csv_path,
            project_id=args.project_id,
            name=args.name,
            release_date=release_date,
        )
        print(
            f"Imported {len(result.tasks)} task(s), {len(result.errors)} error(s), "
            f"{len(result.warnings)} warning(s)",
            file=sys.stderr,
        )
        for err in result.errors:
            print(f"  ERROR   {err}", file=sys.stderr)
        for warn in result.warnings:
            print(f"  WARNING {warn}", file=sys.stderr)

    if args.assess:
        from risk_engine import assess_project

        payload = assess_project(project).model_dump(mode="json")
    else:
        payload = project.model_dump(mode="json")

    text = json.dumps(payload, indent=2)
    if args.out:
        Path(args.out).write_text(text, encoding="utf-8")
        print(f"Wrote {args.out}", file=sys.stderr)
    else:
        print(text)


if __name__ == "__main__":
    _cli()

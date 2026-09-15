import { startOfDay, toIsoDate } from "@/lib/format";
import type { Priority, Project, Task, TaskStatus } from "@/types/reroute";

/**
 * Client-side mirror of the backend's documented CSV contract (see
 * backend/csv_import.py). This exists ONLY to render an uploaded file — every
 * score, factor and intervention still comes from POST /api/projects/upload.
 * The backend is the sole authority on whether a row is valid; if it silently
 * drops a row, that task simply renders with no risk data here.
 */

const STATUSES: TaskStatus[] = ["todo", "in_progress", "blocked", "done"];
const PRIORITIES: Priority[] = ["low", "medium", "high", "critical"];

export class CsvParseError extends Error {}

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells;
}

function parseRows(text: string): Array<Record<string, string>> {
  const lines = text.split(/\r\n|\n|\r/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return [];
  const header = splitCsvLine(lines[0]).map((cell) => cell.trim());
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    const row: Record<string, string> = {};
    header.forEach((key, index) => {
      row[key] = (cells[index] ?? "").trim();
    });
    return row;
  });
}

function splitDependencies(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .replace(/;/g, ",")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function coerceStatus(raw: string | undefined): TaskStatus {
  const value = (raw ?? "").trim().toLowerCase();
  return (STATUSES as string[]).includes(value) ? (value as TaskStatus) : "todo";
}

function coercePriority(raw: string | undefined): Priority {
  const value = (raw ?? "medium").trim().toLowerCase();
  return (PRIORITIES as string[]).includes(value) ? (value as Priority) : "medium";
}

/** Best-effort row -> Task. Returns null for rows too broken to render at all. */
function toTask(row: Record<string, string>, today: Date, now: Date): Task | null {
  const taskId = row.task_id?.trim();
  const title = row.title?.trim();
  if (!taskId || !title) return null;

  const isRelative = "due_in_days" in row || "updated_hours_ago" in row;
  let dueDate: string;
  let lastUpdatedAt: string;

  if (isRelative) {
    const dueInDays = Number.parseInt(row.due_in_days ?? "0", 10);
    const next = startOfDay(today);
    next.setDate(next.getDate() + (Number.isFinite(dueInDays) ? dueInDays : 0));
    dueDate = toIsoDate(next);

    const hoursAgo = Number.parseFloat(row.updated_hours_ago ?? "0");
    lastUpdatedAt = new Date(now.getTime() - (Number.isFinite(hoursAgo) ? hoursAgo : 0) * 3_600_000).toISOString();
  } else {
    dueDate = row.due_date?.trim() || toIsoDate(today);
    const rawUpdatedAt = row.last_updated_at?.trim();
    lastUpdatedAt = rawUpdatedAt && !Number.isNaN(Date.parse(rawUpdatedAt)) ? new Date(rawUpdatedAt).toISOString() : now.toISOString();
  }

  const progressRaw = Number.parseFloat(row.progress ?? "0");

  return {
    task_id: taskId,
    title,
    owner: row.owner?.trim() || "Unassigned",
    status: coerceStatus(row.status),
    priority: coercePriority(row.priority),
    due_date: dueDate,
    progress: Number.isFinite(progressRaw) ? Math.min(100, Math.max(0, Math.round(progressRaw))) : 0,
    dependencies: splitDependencies(row.dependencies),
    latest_update: row.latest_update?.trim() ?? "",
    last_updated_at: lastUpdatedAt,
  };
}

/**
 * Parses a CSV file into a Project shape for display only. Throws CsvParseError
 * only when the file has no header or no renderable rows at all — anything more
 * specific (a bad date, an unknown status) is the backend's call to make.
 */
export function parseProjectCsv(text: string, fileName: string): Project {
  const rows = parseRows(text);
  if (rows.length === 0) {
    throw new CsvParseError("The file has no data rows.");
  }

  const now = new Date();
  const today = startOfDay(now);
  const tasks = rows.map((row) => toTask(row, today, now)).filter((task): task is Task => task !== null);

  if (tasks.length === 0) {
    throw new CsvParseError("No row had both a task_id and a title.");
  }

  const latestDue = tasks.reduce((max, task) => (task.due_date > max ? task.due_date : max), tasks[0].due_date);

  return {
    project_id: "imported-project",
    name: fileName.replace(/\.csv$/i, "") || "Imported project",
    release_date: latestDue,
    tasks,
  };
}

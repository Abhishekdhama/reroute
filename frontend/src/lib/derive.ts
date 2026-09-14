import type { Project, ProjectRisk, RiskBand, TaskView } from "@/types/reroute";
import { buildGraph, criticalPath, descendants, type DependencyGraph } from "@/lib/graph";
import { daysUntil, parseIsoDate } from "@/lib/format";
import { PRIORITY_RANK } from "@/lib/labels";

/** Mirrors the backend's release-health thresholds so one vocabulary is used everywhere. */
export function bandForScore(score: number): RiskBand {
  if (score >= 70) return "critical";
  if (score >= 40) return "at_risk";
  if (score >= 25) return "watch";
  return "stable";
}

export interface Workspace {
  project: Project;
  risk: ProjectRisk;
  graph: DependencyGraph;
  tasks: TaskView[];
  byId: Map<string, TaskView>;
  criticalPathIds: string[];
  ranked: TaskView[];
  signals: ProjectSignals;
}

export interface ProjectSignals {
  totalTasks: number;
  completed: number;
  blocked: number;
  overdue: number;
  atRisk: number;
  dueThisWeek: number;
  criticalPathLength: number;
  criticalPathAtRisk: number;
  largestBlastRadius: number;
  daysToRelease: number;
  averageProgress: number;
}

export function deriveWorkspace(project: Project, risk: ProjectRisk, now = new Date()): Workspace {
  const graph = buildGraph(project.tasks);
  const riskById = new Map(risk.at_risk_tasks.map((entry) => [entry.task_id, entry]));
  const criticalPathIds = criticalPath(graph);
  const onCriticalPath = new Set(criticalPathIds);
  const incomplete = new Set(project.tasks.filter((task) => task.status !== "done").map((t) => t.task_id));

  const tasks: TaskView[] = project.tasks.map((task) => {
    const taskRisk = riskById.get(task.task_id) ?? null;
    const score = taskRisk?.score ?? 0;
    const daysToDue = daysUntil(task.due_date, now);
    return {
      ...task,
      risk: taskRisk,
      score,
      band: task.status === "done" ? "stable" : bandForScore(score),
      dependents: graph.dependents.get(task.task_id) ?? [],
      downstream: taskRisk?.downstream_task_ids ?? descendants(graph, task.task_id),
      blockedByIncomplete: (graph.prerequisites.get(task.task_id) ?? []).filter((id) => incomplete.has(id)),
      onCriticalPath: onCriticalPath.has(task.task_id),
      daysToDue,
      isOverdue: daysToDue < 0 && task.status !== "done",
    };
  });

  const byId = new Map(tasks.map((task) => [task.task_id, task]));
  const ranked = risk.at_risk_tasks
    .map((entry) => byId.get(entry.task_id))
    .filter((task): task is TaskView => Boolean(task));

  const active = tasks.filter((task) => task.status !== "done");
  const signals: ProjectSignals = {
    totalTasks: tasks.length,
    completed: tasks.filter((task) => task.status === "done").length,
    blocked: tasks.filter((task) => task.status === "blocked").length,
    overdue: tasks.filter((task) => task.isOverdue).length,
    atRisk: ranked.length,
    dueThisWeek: active.filter((task) => task.daysToDue >= 0 && task.daysToDue <= 7).length,
    criticalPathLength: criticalPathIds.length,
    criticalPathAtRisk: criticalPathIds.filter((id) => (byId.get(id)?.score ?? 0) >= 25).length,
    largestBlastRadius: ranked.reduce((max, task) => Math.max(max, task.downstream.length), 0),
    daysToRelease: daysUntil(project.release_date, now),
    averageProgress: active.length
      ? Math.round(active.reduce((sum, task) => sum + task.progress, 0) / active.length)
      : 100,
  };

  return { project, risk, graph, tasks, byId, criticalPathIds, ranked, signals };
}

export function sortByDueDate(tasks: TaskView[]): TaskView[] {
  return [...tasks].sort(
    (a, b) => parseIsoDate(a.due_date).getTime() - parseIsoDate(b.due_date).getTime(),
  );
}

export type TaskSortKey = "risk" | "due" | "priority" | "progress" | "title";

export function sortTasks(tasks: TaskView[], key: TaskSortKey, direction: 1 | -1 = 1): TaskView[] {
  const compare: Record<TaskSortKey, (a: TaskView, b: TaskView) => number> = {
    risk: (a, b) => b.score - a.score,
    due: (a, b) => parseIsoDate(a.due_date).getTime() - parseIsoDate(b.due_date).getTime(),
    priority: (a, b) => PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority],
    progress: (a, b) => b.progress - a.progress,
    title: (a, b) => a.title.localeCompare(b.title),
  };
  return [...tasks].sort((a, b) => compare[key](a, b) * direction);
}

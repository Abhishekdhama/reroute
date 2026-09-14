import type { Task } from "@/types/reroute";

export interface DependencyGraph {
  ids: string[];
  /** prerequisite -> tasks that depend on it */
  dependents: Map<string, string[]>;
  /** task -> its prerequisites, filtered to tasks present in the project */
  prerequisites: Map<string, string[]>;
}

export function buildGraph(tasks: Task[]): DependencyGraph {
  const ids = tasks.map((task) => task.task_id);
  const known = new Set(ids);
  const dependents = new Map<string, string[]>(ids.map((id) => [id, []]));
  const prerequisites = new Map<string, string[]>();

  for (const task of tasks) {
    const deps = task.dependencies.filter((id) => known.has(id));
    prerequisites.set(task.task_id, deps);
    for (const dep of deps) {
      dependents.get(dep)?.push(task.task_id);
    }
  }
  return { ids, dependents, prerequisites };
}

export function descendants(graph: DependencyGraph, taskId: string): string[] {
  const seen = new Set<string>();
  const queue = [...(graph.dependents.get(taskId) ?? [])];
  while (queue.length > 0) {
    const current = queue.shift() as string;
    if (seen.has(current)) continue;
    seen.add(current);
    queue.push(...(graph.dependents.get(current) ?? []));
  }
  return [...seen].sort();
}

export function ancestors(graph: DependencyGraph, taskId: string): string[] {
  const seen = new Set<string>();
  const queue = [...(graph.prerequisites.get(taskId) ?? [])];
  while (queue.length > 0) {
    const current = queue.shift() as string;
    if (seen.has(current)) continue;
    seen.add(current);
    queue.push(...(graph.prerequisites.get(current) ?? []));
  }
  return [...seen].sort();
}

/** Longest-path depth from any task without prerequisites. Drives graph columns. */
export function depthByTask(graph: DependencyGraph): Map<string, number> {
  const depth = new Map<string, number>();
  const visiting = new Set<string>();

  const resolve = (id: string): number => {
    const cached = depth.get(id);
    if (cached !== undefined) return cached;
    if (visiting.has(id)) return 0;
    visiting.add(id);
    const deps = graph.prerequisites.get(id) ?? [];
    const value = deps.length === 0 ? 0 : Math.max(...deps.map(resolve)) + 1;
    visiting.delete(id);
    depth.set(id, value);
    return value;
  };

  for (const id of graph.ids) resolve(id);
  return depth;
}

/**
 * The longest dependency chain in the project. Slippage anywhere on it moves the
 * whole plan, which is what makes it worth flagging in the UI.
 */
export function criticalPath(graph: DependencyGraph): string[] {
  const depth = depthByTask(graph);
  let tail: string | null = null;
  let best = -1;
  for (const id of graph.ids) {
    const value = depth.get(id) ?? 0;
    const isTerminal = (graph.dependents.get(id) ?? []).length === 0;
    if (value > best || (value === best && isTerminal)) {
      best = value;
      tail = id;
    }
  }
  if (!tail) return [];

  const path = [tail];
  let current = tail;
  while ((graph.prerequisites.get(current) ?? []).length > 0) {
    const deps = graph.prerequisites.get(current) as string[];
    const next = deps.reduce((a, b) => ((depth.get(a) ?? 0) >= (depth.get(b) ?? 0) ? a : b));
    path.unshift(next);
    current = next;
  }
  return path;
}

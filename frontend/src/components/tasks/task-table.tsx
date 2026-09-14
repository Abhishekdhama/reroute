"use client";

import { cn } from "@/lib/cn";
import { Avatar } from "@/components/ui/avatar";
import {
  DueTag,
  PriorityTag,
  ProgressCell,
  RiskBadge,
  StatusPill,
  TaskIdTag,
} from "@/components/tasks/task-meta";
import { BAND_TONE, TONE_BG } from "@/lib/labels";
import type { TaskSortKey } from "@/lib/derive";
import type { TaskView } from "@/types/reroute";

interface Column {
  key: TaskSortKey | null;
  label: string;
  className: string;
}

/** Keys whose natural first click reads high-to-low. */
const DESCENDING_FIRST = new Set<TaskSortKey>(["risk", "progress", "priority"]);

const COLUMNS: Column[] = [
  { key: "title", label: "Task", className: "min-w-[240px]" },
  { key: null, label: "Owner", className: "w-[150px] hidden md:table-cell" },
  { key: null, label: "Status", className: "w-[120px] hidden sm:table-cell" },
  { key: "priority", label: "Priority", className: "w-[92px] hidden lg:table-cell" },
  { key: "progress", label: "Progress", className: "w-[132px] hidden lg:table-cell" },
  { key: "due", label: "Due", className: "w-[116px]" },
  { key: null, label: "Deps", className: "w-[104px] hidden xl:table-cell" },
  { key: "risk", label: "Risk", className: "w-[116px]" },
];

export function TaskTable({
  tasks,
  selectedTaskId,
  sortKey,
  sortDirection,
  onSort,
  onSelect,
}: {
  tasks: TaskView[];
  selectedTaskId: string | null;
  sortKey: TaskSortKey;
  sortDirection: 1 | -1;
  onSort: (key: TaskSortKey) => void;
  onSelect: (taskId: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-line">
            {COLUMNS.map((column) => (
              <th
                key={column.label}
                scope="col"
                aria-sort={
                  column.key && column.key === sortKey
                    ? isDescending(column.key, sortDirection)
                      ? "descending"
                      : "ascending"
                    : undefined
                }
                className={cn(
                  "px-3 py-2 text-micro font-semibold uppercase tracking-[0.07em] text-ink-faint",
                  column.className,
                )}
              >
                {column.key ? (
                  <button
                    type="button"
                    onClick={() => onSort(column.key as TaskSortKey)}
                    className="inline-flex items-center gap-1 rounded transition-colors hover:text-ink-muted"
                  >
                    {column.label}
                    {column.key === sortKey ? (
                      <span aria-hidden="true" className="text-[8px]">
                        {isDescending(column.key, sortDirection) ? "▼" : "▲"}
                      </span>
                    ) : null}
                  </button>
                ) : (
                  column.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr
              key={task.task_id}
              onClick={() => onSelect(task.task_id)}
              tabIndex={0}
              role="button"
              aria-pressed={selectedTaskId === task.task_id}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect(task.task_id);
                }
              }}
              className={cn(
                "cursor-pointer border-b border-line transition-colors",
                selectedTaskId === task.task_id ? "bg-raised" : "hover:bg-raised/50",
              )}
            >
              <td className="px-3 py-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className={cn("h-3.5 w-0.5 shrink-0 rounded-full", TONE_BG[BAND_TONE[task.band]])}
                    aria-hidden="true"
                  />
                  <span className="truncate text-body text-ink">{task.title}</span>
                  <TaskIdTag id={task.task_id} className="shrink-0" />
                  {task.onCriticalPath ? (
                    <span className="hidden shrink-0 text-micro text-ink-faint xl:inline">critical path</span>
                  ) : null}
                </div>
              </td>
              <td className="hidden px-3 py-2 md:table-cell">
                <div className="flex items-center gap-1.5">
                  <Avatar name={task.owner} />
                  <span className="truncate text-meta text-ink-muted">{task.owner}</span>
                </div>
              </td>
              <td className="hidden px-3 py-2 sm:table-cell">
                <StatusPill status={task.status} />
              </td>
              <td className="hidden px-3 py-2 lg:table-cell">
                <PriorityTag priority={task.priority} />
              </td>
              <td className="hidden px-3 py-2 lg:table-cell">
                <ProgressCell value={task.progress} band={task.band} />
              </td>
              <td className="px-3 py-2">
                <DueTag dueDate={task.due_date} overdue={task.isOverdue} done={task.status === "done"} />
              </td>
              <td className="hidden px-3 py-2 xl:table-cell">
                <span
                  className="tnum whitespace-nowrap text-meta text-ink-faint"
                  title={`${task.dependencies.length} prerequisite(s), ${task.dependents.length} dependent(s)`}
                >
                  {task.dependencies.length} in · {task.dependents.length} out
                </span>
              </td>
              <td className="px-3 py-2">
                <RiskBadge band={task.band} score={task.score} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function isDescending(key: TaskSortKey, direction: 1 | -1): boolean {
  return DESCENDING_FIRST.has(key) ? direction === 1 : direction === -1;
}

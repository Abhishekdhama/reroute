"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { EmptyState } from "@/components/ui/feedback";
import { TaskIdTag } from "@/components/tasks/task-meta";
import { BAND_TONE, TONE_BG } from "@/lib/labels";
import type { TaskView } from "@/types/reroute";

export function TaskMiniList({
  tasks,
  onSelect,
  meta,
  emptyTitle,
  emptyDescription,
}: {
  tasks: TaskView[];
  onSelect: (taskId: string) => void;
  meta: (task: TaskView) => ReactNode;
  emptyTitle: string;
  emptyDescription?: string;
}) {
  if (tasks.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} className="py-8" />;
  }

  return (
    <ul className="divide-y divide-line">
      {tasks.map((task) => (
        <li key={task.task_id}>
          <button
            type="button"
            onClick={() => onSelect(task.task_id)}
            className={cn(
              "flex w-full items-center gap-2.5 px-4 py-2.5 text-left transition-colors hover:bg-raised/60",
            )}
          >
            <span
              className={cn("h-3.5 w-0.5 shrink-0 rounded-full", TONE_BG[BAND_TONE[task.band]])}
              aria-hidden="true"
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-meta text-ink">{task.title}</span>
              <span className="mt-0.5 flex items-center gap-2">
                <TaskIdTag id={task.task_id} />
                <span className="truncate text-micro text-ink-faint">{task.owner}</span>
              </span>
            </span>
            <span className="shrink-0 text-right">{meta(task)}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

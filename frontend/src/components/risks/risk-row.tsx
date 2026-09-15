"use client";

import { cn } from "@/lib/cn";
import { explainRisk } from "@/lib/explain";
import { BAND_LABEL, BAND_TONE, TONE_BG, TONE_TEXT } from "@/lib/labels";
import { pluralize } from "@/lib/format";
import { Avatar } from "@/components/ui/avatar";
import { DueTag, TaskIdTag } from "@/components/tasks/task-meta";
import type { TaskView } from "@/types/reroute";

export function RiskRow({
  task,
  rank,
  selected,
  onSelect,
}: {
  task: TaskView;
  rank?: number;
  selected?: boolean;
  onSelect: (taskId: string) => void;
}) {
  const tone = BAND_TONE[task.band];

  return (
    <button
      type="button"
      onClick={() => onSelect(task.task_id)}
      aria-current={selected ? "true" : undefined}
      className={cn(
        "group flex w-full items-start gap-3 border-l-2 px-4 py-3 text-left transition-colors",
        selected
          ? "border-l-brand bg-raised"
          : "border-l-transparent hover:bg-raised/50",
      )}
    >
      {rank !== undefined ? (
        <span className="tnum mt-0.5 w-4 shrink-0 text-meta text-ink-faint">{rank}</span>
      ) : null}

      <span className="mt-0.5 flex w-10 shrink-0 flex-col items-end gap-1">
        <span className={cn("tnum text-body font-semibold leading-none", TONE_TEXT[tone])}>
          {task.score}
        </span>
        <span className="h-0.5 w-full overflow-hidden rounded-full bg-line">
          <span className={cn("block h-full rounded-full", TONE_BG[tone])} style={{ width: `${task.score}%` }} />
        </span>
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="truncate text-body font-medium text-ink">{task.title}</span>
          <TaskIdTag id={task.task_id} />
          <span className={cn("text-micro font-medium", TONE_TEXT[tone])}>{BAND_LABEL[task.band]}</span>
        </span>
        <span className="mt-1 block text-meta leading-snug text-ink-muted">
          {explainRisk(task, task.risk)}
        </span>
        <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="flex items-center gap-1.5">
            <Avatar name={task.owner} className="h-4 w-4 text-[8px]" />
            <span className="text-meta text-ink-faint">{task.owner}</span>
          </span>
          <DueTag dueDate={task.due_date} overdue={task.isOverdue} />
          {task.downstream.length > 0 ? (
            <span className="text-meta text-ink-faint">
              {pluralize(task.downstream.length, "task")} downstream
            </span>
          ) : null}
          {task.onCriticalPath ? <span className="text-meta text-ink-faint">Critical path</span> : null}
        </span>
      </span>
    </button>
  );
}

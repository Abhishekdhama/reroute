"use client";

import { cn } from "@/lib/cn";
import { SectionLabel } from "@/components/ui/panel";
import { StatusPill, TaskIdTag } from "@/components/tasks/task-meta";
import { BAND_TONE, TONE_BG } from "@/lib/labels";
import { pluralize } from "@/lib/format";
import type { Workspace } from "@/lib/derive";
import type { TaskView } from "@/types/reroute";

export function BlastRadius({
  task,
  workspace,
  onSelect,
}: {
  task: TaskView;
  workspace: Workspace;
  onSelect?: (taskId: string) => void;
}) {
  const direct = task.dependents;
  const downstream = task.downstream;
  const indirect = downstream.filter((id) => !direct.includes(id));
  const onCriticalPath = downstream.filter((id) => workspace.byId.get(id)?.onCriticalPath);

  if (downstream.length === 0) {
    return (
      <div>
        <SectionLabel>Blast radius</SectionLabel>
        <p className="mt-2 text-meta text-ink-muted">
          Nothing depends on this task. A slip here does not move other work.
        </p>
      </div>
    );
  }

  return (
    <div>
      <SectionLabel>Blast radius</SectionLabel>
      <p className="mt-2 text-body leading-snug text-ink">
        If <span className="font-medium">{task.title}</span> slips,{" "}
        <span className="font-medium text-atrisk">{pluralize(downstream.length, "task")}</span> downstream
        {onCriticalPath.length > 0 ? (
          <>
            {" "}
            move with it, including {pluralize(onCriticalPath.length, "task")} on the critical path.
          </>
        ) : (
          <> move with it.</>
        )}
      </p>

      <dl className="mt-3 grid grid-cols-3 gap-px overflow-hidden rounded-md border border-line bg-line">
        <Stat label="Direct" value={direct.length} />
        <Stat label="Indirect" value={indirect.length} />
        <Stat label="On critical path" value={onCriticalPath.length} tone={onCriticalPath.length > 0} />
      </dl>

      <ul className="mt-3 flex flex-col divide-y divide-line overflow-hidden rounded-md border border-line">
        {downstream.map((id) => {
          const affected = workspace.byId.get(id);
          if (!affected) return null;
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => onSelect?.(id)}
                disabled={!onSelect}
                className={cn(
                  "flex w-full items-center gap-2.5 bg-surface px-3 py-2 text-left transition-colors",
                  onSelect && "hover:bg-raised",
                )}
              >
                <span
                  className={cn("h-3 w-0.5 shrink-0 rounded-full", TONE_BG[BAND_TONE[affected.band]])}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1 truncate text-meta text-ink">{affected.title}</span>
                <TaskIdTag id={affected.task_id} className="hidden sm:inline" />
                {direct.includes(id) ? (
                  <span className="shrink-0 text-micro text-ink-faint">direct</span>
                ) : null}
                <StatusPill status={affected.status} className="shrink-0" />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: boolean }) {
  return (
    <div className="bg-surface px-3 py-2">
      <dt className="text-micro uppercase tracking-[0.06em] text-ink-faint">{label}</dt>
      <dd className={cn("tnum mt-0.5 text-title font-semibold", tone ? "text-atrisk" : "text-ink")}>
        {value}
      </dd>
    </div>
  );
}

"use client";

import { cn } from "@/lib/cn";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { STATUS_DOT, STATUS_LABEL, BAND_TONE, TONE_BG } from "@/lib/labels";
import { formatDate, pluralize } from "@/lib/format";
import type { Workspace } from "@/lib/derive";

export function CriticalPathStrip({
  workspace,
  onSelect,
}: {
  workspace: Workspace;
  onSelect: (taskId: string) => void;
}) {
  const path = workspace.criticalPathIds
    .map((id) => workspace.byId.get(id))
    .filter((task): task is NonNullable<typeof task> => Boolean(task));

  const firstBreak = path.find((task) => task.status === "blocked" || task.score >= 40);

  return (
    <Panel>
      <PanelHeader
        title="Critical path"
        description={
          firstBreak
            ? `Longest dependency chain in the release. It currently breaks at ${firstBreak.title}.`
            : `Longest dependency chain in the release — ${pluralize(path.length, "task")}, none flagged.`
        }
      />
      <div className="overflow-x-auto px-4 py-3">
        <ol className="flex min-w-max items-stretch gap-0">
          {path.map((task, index) => (
            <li key={task.task_id} className="flex items-stretch">
              {index > 0 ? (
                <span className="mx-1.5 w-5 self-center border-t border-line" aria-hidden="true" />
              ) : null}
              <button
                type="button"
                onClick={() => onSelect(task.task_id)}
                className={cn(
                  "flex w-[152px] flex-col gap-1 rounded-md border px-2.5 py-2 text-left transition-colors",
                  task === firstBreak
                    ? "border-critical/40 bg-critical/[0.06]"
                    : "border-line bg-raised/40 hover:border-line-strong hover:bg-raised",
                )}
              >
                <span className="flex items-center gap-1.5">
                  <span
                    className={cn("h-2.5 w-0.5 shrink-0 rounded-full", TONE_BG[BAND_TONE[task.band]])}
                    aria-hidden="true"
                  />
                  <span className="truncate text-meta font-medium text-ink">{task.title}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[task.status])} aria-hidden="true" />
                  <span className="text-micro text-ink-faint">{STATUS_LABEL[task.status]}</span>
                  <span className="tnum ml-auto text-micro text-ink-faint">{formatDate(task.due_date)}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </Panel>
  );
}

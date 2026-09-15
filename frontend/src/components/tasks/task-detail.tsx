"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress";
import { SectionLabel } from "@/components/ui/panel";
import { DueTag, StatusPill, TaskIdTag } from "@/components/tasks/task-meta";
import { BlastRadius } from "@/components/risks/blast-radius";
import { InterventionCard } from "@/components/risks/intervention";
import { ReassessDialog } from "@/components/risks/reassess-dialog";
import { normalizeCounts } from "@/lib/explain";
import { formatDate, formatRelativeTime } from "@/lib/format";
import { BAND_LABEL, BAND_TONE, PRIORITY_LABEL, TONE_BG, TONE_TEXT } from "@/lib/labels";
import type { Workspace } from "@/lib/derive";
import type { TaskView } from "@/types/reroute";

export function TaskDetail({
  task,
  workspace,
  onSelect,
  showGraphLink = true,
}: {
  task: TaskView;
  workspace: Workspace;
  onSelect?: (taskId: string) => void;
  showGraphLink?: boolean;
}) {
  const router = useRouter();
  const [reassessOpen, setReassessOpen] = useState(false);
  const tone = BAND_TONE[task.band];
  const upstream = workspace.graph.prerequisites.get(task.task_id) ?? [];

  return (
    <div className="flex flex-col gap-5 p-4">
      <header>
        <div className="flex items-start gap-2.5">
          <span className={cn("mt-1 h-4 w-0.5 shrink-0 rounded-full", TONE_BG[tone])} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <h2 className="text-title font-semibold leading-snug text-ink">{task.title}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <TaskIdTag id={task.task_id} />
              <StatusPill status={task.status} />
              <span className="text-meta text-ink-faint">{PRIORITY_LABEL[task.priority]} priority</span>
              {task.onCriticalPath ? (
                <span className="text-meta text-ink-faint">Critical path</span>
              ) : null}
            </div>
          </div>
          {task.risk ? (
            <div className="shrink-0 text-right">
              <p className={cn("tnum text-title font-semibold leading-none", TONE_TEXT[tone])}>
                {task.score}
              </p>
              <p className={cn("mt-1 text-micro font-medium", TONE_TEXT[tone])}>{BAND_LABEL[task.band]}</p>
            </div>
          ) : null}
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
          <div>
            <dt className="text-micro uppercase tracking-[0.06em] text-ink-faint">Owner</dt>
            <dd className="mt-1 flex items-center gap-1.5">
              <Avatar name={task.owner} />
              <span className="truncate text-meta text-ink">{task.owner}</span>
            </dd>
          </div>
          <div>
            <dt className="text-micro uppercase tracking-[0.06em] text-ink-faint">Due</dt>
            <dd className="mt-1 flex items-center gap-1.5">
              <span className="tnum text-meta text-ink">{formatDate(task.due_date)}</span>
              <DueTag dueDate={task.due_date} overdue={task.isOverdue} done={task.status === "done"} />
            </dd>
          </div>
          <div className="col-span-2">
            <dt className="text-micro uppercase tracking-[0.06em] text-ink-faint">Progress</dt>
            <dd className="mt-1.5 flex items-center gap-2">
              <ProgressBar value={task.progress} tone={task.band === "stable" ? "brand" : tone} className="flex-1" />
              <span className="tnum text-meta text-ink-muted">{task.progress}%</span>
            </dd>
          </div>
        </dl>
      </header>

      {task.risk ? (
        <InterventionCard
          task={task}
          onAskOwner={() => setReassessOpen(true)}
          onViewAffected={
            task.downstream.length > 0 && onSelect
              ? () => onSelect(task.downstream[0])
              : undefined
          }
          onOpenGraph={showGraphLink ? () => router.push("/dependencies") : undefined}
        />
      ) : (
        <div className="rounded-md border border-line bg-raised/50 p-3">
          <p className="text-meta text-ink-muted">
            No risk factors crossed the reporting threshold for this task.
          </p>
        </div>
      )}

      {task.risk && task.risk.factors.length > 0 ? (
        <div>
          <SectionLabel>Why this is at risk</SectionLabel>
          <ul className="mt-2 flex flex-col gap-1.5">
            {task.risk.factors.map((factor) => (
              <li key={factor} className="flex items-start gap-2 text-meta leading-snug text-ink-muted">
                <span className={cn("mt-1.5 h-1 w-1 shrink-0 rounded-full", TONE_BG[tone])} aria-hidden="true" />
                {normalizeCounts(factor)}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-micro text-ink-faint">
            Scored by the Reroute risk engine · {task.score}/100
          </p>
        </div>
      ) : null}

      <BlastRadius task={task} workspace={workspace} onSelect={onSelect} />

      {upstream.length > 0 ? (
        <div>
          <SectionLabel>Depends on</SectionLabel>
          <ul className="mt-2 flex flex-col gap-1">
            {upstream.map((id) => {
              const dependency = workspace.byId.get(id);
              if (!dependency) return null;
              const incomplete = dependency.status !== "done";
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => onSelect?.(id)}
                    disabled={!onSelect}
                    className={cn(
                      "flex w-full items-center gap-2 rounded px-1.5 py-1 text-left transition-colors",
                      onSelect && "hover:bg-raised",
                    )}
                  >
                    <span
                      className={cn("h-1.5 w-1.5 shrink-0 rounded-full", incomplete ? TONE_BG[BAND_TONE[dependency.band]] : "bg-healthy")}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1 truncate text-meta text-ink">{dependency.title}</span>
                    <StatusPill status={dependency.status} />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {task.latest_update ? (
        <div>
          <SectionLabel>Latest update</SectionLabel>
          <p className="mt-2 text-meta leading-relaxed text-ink-muted">{task.latest_update}</p>
          <p className="mt-1.5 text-micro text-ink-faint">
            {task.owner} · {formatRelativeTime(task.last_updated_at)}
          </p>
        </div>
      ) : null}

      {!task.risk ? (
        <div className="flex flex-wrap gap-2 border-t border-line pt-4">
          <Button size="sm" onClick={() => setReassessOpen(true)}>
            Record update &amp; reassess
          </Button>
        </div>
      ) : null}

      <ReassessDialog task={task} open={reassessOpen} onClose={() => setReassessOpen(false)} />
    </div>
  );
}

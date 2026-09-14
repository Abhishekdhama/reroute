"use client";

import { PageHeader } from "@/components/layout/page-header";
import { WorkspaceGate } from "@/components/layout/workspace-gate";
import { RiskDelta } from "@/components/risks/risk-delta";
import { Panel } from "@/components/ui/panel";
import { EmptyState, Skeleton } from "@/components/ui/feedback";
import { Avatar } from "@/components/ui/avatar";
import { StatusPill, TaskIdTag } from "@/components/tasks/task-meta";
import { cn } from "@/lib/cn";
import { useWorkspace } from "@/lib/workspace";
import { formatRelativeTime, pluralize } from "@/lib/format";
import { BAND_TONE, TONE_BG } from "@/lib/labels";
import type { Workspace } from "@/lib/derive";
import type { ReassessmentEvent } from "@/lib/workspace";

type Entry =
  | { kind: "reassessment"; at: string; event: ReassessmentEvent }
  | { kind: "update"; at: string; taskId: string };

export default function ActivityPage() {
  const { history, selectTask } = useWorkspace();

  return (
    <WorkspaceGate skeleton={<Skeleton className="h-64 w-full rounded-panel" />}>
      {(workspace) => {
        const entries: Entry[] = [
          ...history.map((event) => ({ kind: "reassessment" as const, at: event.at, event })),
          ...workspace.tasks
            .filter((task) => task.latest_update)
            .map((task) => ({ kind: "update" as const, at: task.last_updated_at, taskId: task.task_id })),
        ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

        return (
          <>
            <PageHeader
              title="Activity"
              description={
                history.length > 0
                  ? `${pluralize(history.length, "reassessment")} this session · latest task updates`
                  : "Task updates and reassessments, newest first"
              }
            />

            <div className="max-w-4xl p-4 md:p-6">
              {entries.length === 0 ? (
                <EmptyState title="No activity yet" description="Task updates will appear here." />
              ) : (
                <Panel>
                  <ol className="divide-y divide-line">
                    {entries.map((entry) =>
                      entry.kind === "reassessment" ? (
                        <ReassessmentEntry key={entry.event.id} event={entry.event} />
                      ) : (
                        <UpdateEntry
                          key={`${entry.taskId}-${entry.at}`}
                          taskId={entry.taskId}
                          workspace={workspace}
                          onSelect={selectTask}
                        />
                      ),
                    )}
                  </ol>
                </Panel>
              )}
            </div>
          </>
        );
      }}
    </WorkspaceGate>
  );
}

function ReassessmentEntry({ event }: { event: ReassessmentEvent }) {
  return (
    <li className="border-l-2 border-l-brand bg-brand/[0.03] px-4 py-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-body font-medium text-ink">
          Plan reassessed after {event.taskTitle} update
        </p>
        <span className="text-micro text-ink-faint">{formatRelativeTime(event.at)}</span>
      </div>
      <p className="mt-1 text-meta leading-relaxed text-ink-muted">{event.reply.update}</p>
      <div className="mt-3">
        <RiskDelta event={event} compact />
      </div>
    </li>
  );
}

function UpdateEntry({
  taskId,
  workspace,
  onSelect,
}: {
  taskId: string;
  workspace: Workspace;
  onSelect: (taskId: string) => void;
}) {
  const task = workspace.byId.get(taskId);
  if (!task) return null;

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(taskId)}
        className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-raised/50"
      >
        <span
          className={cn("mt-1 h-3.5 w-0.5 shrink-0 rounded-full", TONE_BG[BAND_TONE[task.band]])}
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-body font-medium text-ink">{task.title}</span>
            <TaskIdTag id={task.task_id} />
            <StatusPill status={task.status} />
          </span>
          <span className="mt-1 block text-meta leading-relaxed text-ink-muted">{task.latest_update}</span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <Avatar name={task.owner} className="h-4 w-4 text-[8px]" />
          <span className="w-14 text-right text-micro text-ink-faint">
            {formatRelativeTime(task.last_updated_at)}
          </span>
        </span>
      </button>
    </li>
  );
}

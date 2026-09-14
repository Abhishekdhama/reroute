"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { WorkspaceGate } from "@/components/layout/workspace-gate";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { ReleaseHealth } from "@/components/dashboard/release-health";
import { SignalStrip } from "@/components/dashboard/signal-strip";
import { TaskMiniList } from "@/components/dashboard/task-mini-list";
import { TopIntervention } from "@/components/dashboard/top-intervention";
import { CriticalPathStrip } from "@/components/dashboard/critical-path";
import { RiskRow } from "@/components/risks/risk-row";
import { DueTag } from "@/components/tasks/task-meta";
import { useWorkspace } from "@/lib/workspace";
import { sortByDueDate } from "@/lib/derive";
import { formatRelativeTime, pluralize } from "@/lib/format";

export default function OverviewPage() {
  const router = useRouter();
  const { refresh, isAssessing, lastAssessedAt, selectTask } = useWorkspace();

  const openRisk = (taskId: string) => {
    selectTask(taskId);
    router.push("/risks");
  };

  return (
    <WorkspaceGate skeleton={<OverviewSkeleton />}>
      {(workspace) => {
        const blocked = workspace.tasks.filter((task) => task.status === "blocked");
        const upcoming = sortByDueDate(
          workspace.tasks.filter((task) => task.status !== "done" && task.daysToDue <= 7),
        ).slice(0, 5);

        return (
          <>
            <PageHeader
              title="Overview"
              description={`${workspace.project.name} · ${pluralize(workspace.signals.totalTasks, "task")} · ${workspace.signals.completed} done`}
            />

            <div className="flex flex-col gap-4 p-4 md:p-6">
              <ReleaseHealth
                workspace={workspace}
                onRefresh={refresh}
                refreshing={isAssessing}
                lastAssessedAt={lastAssessedAt}
              />

              <SignalStrip signals={workspace.signals} />

              <div className="grid gap-4 xl:grid-cols-3">
                <Panel className="xl:col-span-2">
                  <PanelHeader
                    title="Threatening delivery"
                    description="Ranked by the risk engine, highest exposure first"
                    action={
                      <Button size="sm" variant="ghost" onClick={() => router.push("/risks")}>
                        View all
                      </Button>
                    }
                  />
                  {workspace.ranked.length === 0 ? (
                    <p className="px-4 py-8 text-center text-meta text-ink-faint">
                      No task crossed the risk threshold.
                    </p>
                  ) : (
                    <ul className="divide-y divide-line">
                      {workspace.ranked.slice(0, 5).map((task, index) => (
                        <li key={task.task_id}>
                          <RiskRow task={task} rank={index + 1} onSelect={openRisk} />
                        </li>
                      ))}
                    </ul>
                  )}
                </Panel>

                <div className="flex flex-col gap-4">
                  <TopIntervention task={workspace.ranked[0]} onViewAffected={openRisk} />

                  <Panel>
                    <PanelHeader
                      title="Blocked work"
                      description={`${pluralize(blocked.length, "task")} waiting on something`}
                    />
                    <TaskMiniList
                      tasks={blocked}
                      onSelect={openRisk}
                      emptyTitle="Nothing is blocked"
                      emptyDescription="No task is reporting a blocker right now."
                      meta={(task) => (
                        <span className="text-micro text-ink-faint">
                          {formatRelativeTime(task.last_updated_at)}
                        </span>
                      )}
                    />
                  </Panel>

                  <Panel>
                    <PanelHeader title="Next deadlines" description="Open work due within seven days" />
                    <TaskMiniList
                      tasks={upcoming}
                      onSelect={openRisk}
                      emptyTitle="No deadlines this week"
                      meta={(task) => <DueTag dueDate={task.due_date} overdue={task.isOverdue} />}
                    />
                  </Panel>
                </div>
              </div>

              <CriticalPathStrip workspace={workspace} onSelect={openRisk} />
            </div>
          </>
        );
      }}
    </WorkspaceGate>
  );
}

function OverviewSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-36 w-full rounded-panel" />
      <Skeleton className="h-16 w-full rounded-panel" />
      <div className="grid gap-4 xl:grid-cols-3">
        <Skeleton className="h-96 rounded-panel xl:col-span-2" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-44 rounded-panel" />
          <Skeleton className="h-44 rounded-panel" />
        </div>
      </div>
    </div>
  );
}

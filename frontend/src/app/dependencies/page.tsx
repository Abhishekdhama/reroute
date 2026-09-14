"use client";

import { PageHeader } from "@/components/layout/page-header";
import { WorkspaceGate } from "@/components/layout/workspace-gate";
import { DetailDrawer } from "@/components/layout/detail-drawer";
import { DependencyGraph } from "@/components/graph/dependency-graph";
import { GraphLegend } from "@/components/graph/graph-legend";
import { TaskDetail } from "@/components/tasks/task-detail";
import { Button } from "@/components/ui/button";
import { EmptyState, Skeleton } from "@/components/ui/feedback";
import { useWorkspace } from "@/lib/workspace";
import { useIsDesktop } from "@/lib/use-media-query";
import { pluralize } from "@/lib/format";

export default function DependenciesPage() {
  const { selectedTaskId, selectTask } = useWorkspace();
  const isDesktop = useIsDesktop();

  return (
    <WorkspaceGate skeleton={<Skeleton className="h-[70dvh] w-full rounded-panel" />}>
      {(workspace) => {
        const edgeCount = workspace.tasks.reduce((sum, task) => sum + task.dependencies.length, 0);
        const selected = selectedTaskId ? workspace.byId.get(selectedTaskId) : undefined;

        return (
          <div className="flex h-full min-h-[600px] flex-col">
            <PageHeader
              title="Dependencies"
              description={`${pluralize(workspace.tasks.length, "task")} · ${pluralize(edgeCount, "dependency", "dependencies")} · ${pluralize(workspace.criticalPathIds.length, "task")} on the critical path`}
              actions={
                selected ? (
                  <Button size="sm" variant="ghost" onClick={() => selectTask(null)}>
                    Clear selection
                  </Button>
                ) : null
              }
              meta={<GraphLegend />}
            />

            <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_360px]">
              <div className="relative min-h-[420px] border-b border-line lg:border-b-0">
                <DependencyGraph
                  workspace={workspace}
                  selectedTaskId={selectedTaskId}
                  onSelect={selectTask}
                />
              </div>

              {isDesktop ? (
                <aside className="min-h-0 overflow-y-auto border-l border-line bg-surface">
                  {selected ? (
                    <TaskDetail
                      task={selected}
                      workspace={workspace}
                      onSelect={selectTask}
                      showGraphLink={false}
                    />
                  ) : (
                    <EmptyState
                      className="h-full"
                      title="Select a task"
                      description="Click any node to trace what moves if it slips, and what it is waiting on."
                    />
                  )}
                </aside>
              ) : null}
            </div>

            {!isDesktop ? (
              <DetailDrawer open={Boolean(selected)} onClose={() => selectTask(null)} title="Task detail">
                {selected ? (
                  <TaskDetail
                    task={selected}
                    workspace={workspace}
                    onSelect={selectTask}
                    showGraphLink={false}
                  />
                ) : null}
              </DetailDrawer>
            ) : null}
          </div>
        );
      }}
    </WorkspaceGate>
  );
}

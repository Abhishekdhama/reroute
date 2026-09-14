"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { WorkspaceGate } from "@/components/layout/workspace-gate";
import { DetailDrawer } from "@/components/layout/detail-drawer";
import { RiskRow } from "@/components/risks/risk-row";
import { TaskDetail } from "@/components/tasks/task-detail";
import { EmptyState, Skeleton } from "@/components/ui/feedback";
import { FilterSelect } from "@/components/ui/field";
import { useWorkspace } from "@/lib/workspace";
import { useIsDesktop } from "@/lib/use-media-query";
import { pluralize } from "@/lib/format";
import { BAND_LABEL } from "@/lib/labels";
import type { RiskBand } from "@/types/reroute";

const BANDS: RiskBand[] = ["critical", "at_risk", "watch"];

export default function RisksPage() {
  const { selectedTaskId, selectTask } = useWorkspace();
  const isDesktop = useIsDesktop();
  const [band, setBand] = useState<RiskBand | "all">("all");
  const [owner, setOwner] = useState("all");

  return (
    <WorkspaceGate skeleton={<RisksSkeleton />}>
      {(workspace) => {
        const owners = [...new Set(workspace.ranked.map((task) => task.owner))].sort();
        const filtered = workspace.ranked.filter(
          (task) => (band === "all" || task.band === band) && (owner === "all" || task.owner === owner),
        );
        const selected = selectedTaskId ? workspace.byId.get(selectedTaskId) : undefined;
        const detailTask = selected ?? filtered[0];

        return (
          <>
            <PageHeader
              title="Risks"
              description={`${pluralize(workspace.ranked.length, "task")} above the risk threshold · ranked by exposure`}
              actions={
                <>
                  <FilterSelect
                    label="Filter by severity"
                    value={band}
                    onChange={(event) => setBand(event.target.value as RiskBand | "all")}
                  >
                    <option value="all">All severities</option>
                    {BANDS.map((option) => (
                      <option key={option} value={option}>
                        {BAND_LABEL[option]}
                      </option>
                    ))}
                  </FilterSelect>
                  <FilterSelect
                    label="Filter by owner"
                    value={owner}
                    onChange={(event) => setOwner(event.target.value)}
                  >
                    <option value="all">All owners</option>
                    {owners.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </FilterSelect>
                </>
              }
            />

            <div className="grid min-h-0 lg:grid-cols-[minmax(0,1fr)_400px]">
              <div className="min-w-0">
                {filtered.length === 0 ? (
                  <EmptyState
                    title={workspace.ranked.length === 0 ? "No risks detected" : "No risks match these filters"}
                    description={
                      workspace.ranked.length === 0
                        ? "Every task is inside the risk threshold for this release."
                        : "Clear the severity or owner filter to see the full ranking."
                    }
                  />
                ) : (
                  <ul className="divide-y divide-line">
                    {filtered.map((task, index) => (
                      <li key={task.task_id}>
                        <RiskRow
                          task={task}
                          rank={index + 1}
                          selected={detailTask?.task_id === task.task_id && isDesktop}
                          onSelect={selectTask}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {isDesktop ? (
                <aside className="sticky top-[57px] h-[calc(100dvh-57px)] overflow-y-auto border-l border-line bg-surface">
                  {detailTask ? (
                    <TaskDetail task={detailTask} workspace={workspace} onSelect={selectTask} />
                  ) : (
                    <EmptyState
                      className="h-full"
                      title="Select a risk"
                      description="Choose a task to see its blast radius and recommended intervention."
                    />
                  )}
                </aside>
              ) : null}
            </div>

            {!isDesktop ? (
              <DetailDrawer open={Boolean(selected)} onClose={() => selectTask(null)} title="Risk detail">
                {selected ? (
                  <TaskDetail task={selected} workspace={workspace} onSelect={selectTask} />
                ) : null}
              </DetailDrawer>
            ) : null}
          </>
        );
      }}
    </WorkspaceGate>
  );
}

function RisksSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-20 w-full" />
      ))}
    </div>
  );
}

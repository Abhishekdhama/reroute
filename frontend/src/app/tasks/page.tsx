"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { WorkspaceGate } from "@/components/layout/workspace-gate";
import { DetailDrawer } from "@/components/layout/detail-drawer";
import { TaskTable } from "@/components/tasks/task-table";
import { TaskDetail } from "@/components/tasks/task-detail";
import { EmptyState, Skeleton } from "@/components/ui/feedback";
import { FilterSelect, TextInput } from "@/components/ui/field";
import { sortTasks, type TaskSortKey } from "@/lib/derive";
import { useWorkspace } from "@/lib/workspace";
import { PRIORITY_LABEL, STATUS_LABEL } from "@/lib/labels";
import { pluralize } from "@/lib/format";
import type { Priority, TaskStatus } from "@/types/reroute";

const STATUSES: TaskStatus[] = ["todo", "in_progress", "blocked", "done"];
const PRIORITIES: Priority[] = ["critical", "high", "medium", "low"];

export default function TasksPage() {
  const { selectedTaskId, selectTask } = useWorkspace();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<TaskStatus | "all">("all");
  const [owner, setOwner] = useState("all");
  const [priority, setPriority] = useState<Priority | "all">("all");
  const [sortKey, setSortKey] = useState<TaskSortKey>("risk");
  const [sortDirection, setSortDirection] = useState<1 | -1>(1);

  const toggleSort = (key: TaskSortKey) => {
    if (key === sortKey) {
      setSortDirection((direction) => (direction === 1 ? -1 : 1));
    } else {
      setSortKey(key);
      setSortDirection(1);
    }
  };

  return (
    <WorkspaceGate skeleton={<TasksSkeleton />}>
      {(workspace) => {
        const owners = [...new Set(workspace.tasks.map((task) => task.owner))].sort();
        const needle = query.trim().toLowerCase();
        const filtered = sortTasks(
          workspace.tasks.filter(
            (task) =>
              (status === "all" || task.status === status) &&
              (owner === "all" || task.owner === owner) &&
              (priority === "all" || task.priority === priority) &&
              (needle === "" ||
                `${task.title} ${task.task_id} ${task.owner}`.toLowerCase().includes(needle)),
          ),
          sortKey,
          sortDirection,
        );
        const selected = selectedTaskId ? workspace.byId.get(selectedTaskId) : undefined;

        return (
          <>
            <PageHeader
              title="Tasks"
              description={`${pluralize(filtered.length, "task")} shown · ${workspace.signals.completed} of ${workspace.signals.totalTasks} complete`}
              actions={
                <>
                  <div className="w-44">
                    <TextInput
                      type="search"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search tasks"
                      aria-label="Search tasks"
                      className="h-7 py-0 text-meta"
                    />
                  </div>
                  <FilterSelect
                    label="Filter by status"
                    value={status}
                    onChange={(event) => setStatus(event.target.value as TaskStatus | "all")}
                  >
                    <option value="all">All statuses</option>
                    {STATUSES.map((option) => (
                      <option key={option} value={option}>
                        {STATUS_LABEL[option]}
                      </option>
                    ))}
                  </FilterSelect>
                  <FilterSelect
                    label="Filter by priority"
                    value={priority}
                    onChange={(event) => setPriority(event.target.value as Priority | "all")}
                  >
                    <option value="all">All priorities</option>
                    {PRIORITIES.map((option) => (
                      <option key={option} value={option}>
                        {PRIORITY_LABEL[option]}
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

            {filtered.length === 0 ? (
              <EmptyState
                title="No tasks match these filters"
                description="Adjust the search or filters to see work in this release."
              />
            ) : (
              <TaskTable
                tasks={filtered}
                selectedTaskId={selectedTaskId}
                sortKey={sortKey}
                sortDirection={sortDirection}
                onSort={toggleSort}
                onSelect={selectTask}
              />
            )}

            <DetailDrawer open={Boolean(selected)} onClose={() => selectTask(null)} title="Task detail">
              {selected ? (
                <TaskDetail task={selected} workspace={workspace} onSelect={selectTask} />
              ) : null}
            </DetailDrawer>
          </>
        );
      }}
    </WorkspaceGate>
  );
}

function TasksSkeleton() {
  return (
    <div className="flex flex-col gap-1.5">
      {Array.from({ length: 10 }).map((_, index) => (
        <Skeleton key={index} className="h-9 w-full" />
      ))}
    </div>
  );
}

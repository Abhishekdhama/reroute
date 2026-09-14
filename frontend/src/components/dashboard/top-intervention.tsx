"use client";

import { useState } from "react";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { InterventionCard } from "@/components/risks/intervention";
import { ReassessDialog } from "@/components/risks/reassess-dialog";
import { EmptyState } from "@/components/ui/feedback";
import type { TaskView } from "@/types/reroute";

export function TopIntervention({
  task,
  onViewAffected,
}: {
  task: TaskView | undefined;
  onViewAffected: (taskId: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Panel>
      <PanelHeader title="Do this next" description="The smallest move that protects the release" />
      {task ? (
        <div className="p-3">
          <InterventionCard
            task={task}
            showTask
            onAskOwner={() => setOpen(true)}
            onViewAffected={
              task.downstream.length > 0 ? () => onViewAffected(task.task_id) : undefined
            }
          />
          <ReassessDialog task={task} open={open} onClose={() => setOpen(false)} />
        </div>
      ) : (
        <EmptyState
          title="Nothing needs intervention"
          description="No task crossed the risk threshold in the latest assessment."
        />
      )}
    </Panel>
  );
}

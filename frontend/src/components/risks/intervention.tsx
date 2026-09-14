"use client";

import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/panel";
import { SendIcon } from "@/components/ui/icons";
import { pluralize } from "@/lib/format";
import { normalizeCounts } from "@/lib/explain";
import type { TaskView } from "@/types/reroute";

export function InterventionCard({
  task,
  onAskOwner,
  onViewAffected,
  onOpenGraph,
  showTask = false,
}: {
  task: TaskView;
  onAskOwner: () => void;
  onViewAffected?: () => void;
  onOpenGraph?: () => void;
  showTask?: boolean;
}) {
  if (!task.risk) return null;

  return (
    <div className="rounded-md border border-brand/25 bg-brand/[0.04] p-3">
      <div className="flex items-center justify-between gap-2">
        <SectionLabel className="text-brand/90">Recommended intervention</SectionLabel>
        <span className="text-micro text-ink-faint">Smallest next move</span>
      </div>
      {showTask ? (
        <p className="mt-2 flex flex-wrap items-center gap-x-2 text-meta text-ink-muted">
          <span className="font-medium text-ink">{task.title}</span>
          <span className="font-mono text-micro text-ink-faint">{task.task_id}</span>
          <span className="text-ink-faint">
            {task.owner} · {pluralize(task.downstream.length, "task")} downstream
          </span>
        </p>
      ) : null}
      <p className="mt-2 text-body font-medium leading-snug text-ink">
        {normalizeCounts(task.risk.recommended_intervention)}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="primary"
          icon={<SendIcon width={12} height={12} />}
          onClick={onAskOwner}
        >
          Ask {task.owner.split(" ")[0]}
        </Button>
        {onViewAffected && task.downstream.length > 0 ? (
          <Button size="sm" variant="ghost" onClick={onViewAffected}>
            View affected work
          </Button>
        ) : null}
        {onOpenGraph ? (
          <Button size="sm" variant="ghost" onClick={onOpenGraph}>
            Open in graph
          </Button>
        ) : null}
      </div>
    </div>
  );
}

"use client";

import { cn } from "@/lib/cn";
import { NODE_HEIGHT, NODE_WIDTH } from "@/lib/graph-layout";
import { BAND_TONE, STATUS_DOT, STATUS_LABEL, TONE_BG } from "@/lib/labels";
import { initials } from "@/lib/format";
import type { TaskView } from "@/types/reroute";

export type NodeEmphasis = "normal" | "selected" | "downstream" | "upstream" | "muted";

const EMPHASIS_CLASS: Record<NodeEmphasis, string> = {
  normal: "border-line bg-surface",
  selected: "border-brand bg-raised ring-1 ring-brand/40",
  downstream: "border-atrisk/45 bg-atrisk/[0.06]",
  upstream: "border-line-strong bg-surface",
  muted: "border-line bg-surface opacity-30",
};

export function GraphNode({
  task,
  x,
  y,
  emphasis,
  hovered,
  onSelect,
  onHover,
}: {
  task: TaskView;
  x: number;
  y: number;
  emphasis: NodeEmphasis;
  hovered: boolean;
  onSelect: (taskId: string) => void;
  onHover: (taskId: string | null) => void;
}) {
  return (
    <foreignObject x={x} y={y} width={NODE_WIDTH} height={NODE_HEIGHT} overflow="visible">
      <button
        type="button"
        onClick={() => onSelect(task.task_id)}
        onMouseEnter={() => onHover(task.task_id)}
        onMouseLeave={() => onHover(null)}
        onFocus={() => onHover(task.task_id)}
        onBlur={() => onHover(null)}
        aria-pressed={emphasis === "selected"}
        aria-label={`${task.title}, ${STATUS_LABEL[task.status]}, owner ${task.owner}, risk score ${task.score}`}
        style={{ width: NODE_WIDTH, height: NODE_HEIGHT }}
        className={cn(
          "flex flex-col justify-center gap-1.5 overflow-hidden rounded-md border px-2.5 text-left transition-colors duration-150",
          EMPHASIS_CLASS[emphasis],
          hovered && emphasis !== "muted" && "border-ink-faint/60",
          task.onCriticalPath && emphasis !== "muted" && "shadow-[inset_2px_0_0_0_var(--color-line-strong)]",
        )}
      >
        <span className="flex items-center gap-1.5">
          <span
            className={cn("h-2.5 w-0.5 shrink-0 rounded-full", TONE_BG[BAND_TONE[task.band]])}
            aria-hidden="true"
          />
          <span className="truncate text-[12px] font-medium leading-tight text-ink">{task.title}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", STATUS_DOT[task.status])} aria-hidden="true" />
          <span className="font-mono text-[9.5px] text-ink-faint">{task.task_id}</span>
          <span className="text-[9.5px] text-ink-faint">{initials(task.owner)}</span>
          {task.score > 0 ? (
            <span className="tnum ml-auto text-[10px] font-semibold text-ink-muted">{task.score}</span>
          ) : null}
        </span>
        <span className="h-0.5 w-full overflow-hidden rounded-full bg-line">
          <span
            className={cn("block h-full rounded-full", task.status === "done" ? "bg-healthy" : "bg-line-strong")}
            style={{ width: `${task.progress}%` }}
          />
        </span>
      </button>
    </foreignObject>
  );
}

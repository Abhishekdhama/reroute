import { cn } from "@/lib/cn";
import { Tooltip } from "@/components/ui/tooltip";
import type { ProjectSignals } from "@/lib/derive";

interface Signal {
  label: string;
  value: string | number;
  detail: string;
  tone?: "critical" | "atrisk" | "watch" | "neutral";
}

export function SignalStrip({ signals }: { signals: ProjectSignals }) {
  const items: Signal[] = [
    {
      label: "Blocked",
      value: signals.blocked,
      detail: "Tasks explicitly reported as blocked",
      tone: signals.blocked > 0 ? "critical" : "neutral",
    },
    {
      label: "Overdue",
      value: signals.overdue,
      detail: "Incomplete tasks past their due date",
      tone: signals.overdue > 0 ? "critical" : "neutral",
    },
    {
      label: "At risk",
      value: signals.atRisk,
      detail: "Tasks the risk engine flagged above threshold",
      tone: signals.atRisk > 0 ? "atrisk" : "neutral",
    },
    {
      label: "Due ≤ 7 days",
      value: signals.dueThisWeek,
      detail: "Open tasks due within the next week",
      tone: signals.dueThisWeek > 0 ? "watch" : "neutral",
    },
    {
      label: "Widest blast radius",
      value: signals.largestBlastRadius,
      detail: "Most downstream tasks exposed by a single at-risk task",
      tone: signals.largestBlastRadius > 0 ? "atrisk" : "neutral",
    },
    {
      label: "Critical path at risk",
      value: `${signals.criticalPathAtRisk}/${signals.criticalPathLength}`,
      detail: "At-risk tasks on the longest dependency chain",
      tone: signals.criticalPathAtRisk > 0 ? "atrisk" : "neutral",
    },
  ];

  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-panel border border-line bg-line sm:grid-cols-3 xl:grid-cols-6">
      {items.map((item) => (
        <div key={item.label} className="bg-surface px-3 py-2.5">
          <dt className="flex items-center gap-1 text-micro uppercase tracking-[0.06em] text-ink-faint">
            <Tooltip content={item.detail}>
              <span className="cursor-help border-b border-dotted border-line-strong">{item.label}</span>
            </Tooltip>
          </dt>
          <dd
            className={cn(
              "tnum mt-1 text-title font-semibold",
              item.tone === "critical"
                ? "text-critical"
                : item.tone === "atrisk"
                  ? "text-atrisk"
                  : item.tone === "watch"
                    ? "text-watch"
                    : "text-ink",
            )}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress";
import { formatDate, formatDueLabel } from "@/lib/format";
import { BAND_LABEL, BAND_TONE, PRIORITY_LABEL, STATUS_DOT, STATUS_LABEL } from "@/lib/labels";
import type { Priority, RiskBand, TaskStatus } from "@/types/reroute";

export function StatusPill({ status, className }: { status: TaskStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-meta text-ink-muted", className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[status])} aria-hidden="true" />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function PriorityTag({ priority }: { priority: Priority }) {
  const emphasised = priority === "critical" || priority === "high";
  return (
    <span className={cn("text-meta", emphasised ? "text-ink-muted" : "text-ink-faint")}>
      {PRIORITY_LABEL[priority]}
    </span>
  );
}

export function DueTag({
  dueDate,
  overdue,
  done = false,
}: {
  dueDate: string;
  overdue: boolean;
  done?: boolean;
}) {
  if (done) {
    return <span className="tnum text-meta text-ink-faint">{formatDate(dueDate)}</span>;
  }
  const label = formatDueLabel(dueDate);
  const soon = label === "Due today" || label === "Due tomorrow";
  return (
    <span className={cn("tnum text-meta", overdue ? "text-critical" : soon ? "text-watch" : "text-ink-faint")}>
      {label}
    </span>
  );
}

export function RiskBadge({ band, score }: { band: RiskBand; score: number }) {
  if (band === "stable") {
    return <span className="text-meta text-ink-faint">—</span>;
  }
  return (
    <Badge tone={BAND_TONE[band]}>
      <span className="tnum font-semibold">{score}</span>
      <span className="opacity-80">{BAND_LABEL[band]}</span>
    </Badge>
  );
}

export function ProgressCell({ value, band }: { value: number; band: RiskBand }) {
  return (
    <div className="flex items-center gap-2">
      <ProgressBar
        value={value}
        tone={value >= 100 ? "healthy" : band === "stable" ? "brand" : BAND_TONE[band]}
        className="w-12"
        label={`${value}% complete`}
      />
      <span className="tnum w-7 text-meta text-ink-faint">{value}%</span>
    </div>
  );
}

export function TaskIdTag({ id, className }: { id: string; className?: string }) {
  return (
    <span className={cn("font-mono text-micro tracking-tight text-ink-faint", className)}>{id}</span>
  );
}

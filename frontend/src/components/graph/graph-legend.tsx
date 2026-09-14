import { cn } from "@/lib/cn";

const RISK_KEYS = [
  { label: "Critical", className: "bg-critical" },
  { label: "At risk", className: "bg-atrisk" },
  { label: "Watch", className: "bg-watch" },
  { label: "Stable", className: "bg-line-strong" },
];

const STATUS_KEYS = [
  { label: "Blocked", className: "bg-critical" },
  { label: "In progress", className: "bg-brand" },
  { label: "Not started", className: "bg-ink-faint" },
  { label: "Done", className: "bg-healthy" },
];

export function GraphLegend({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-5 gap-y-2", className)}>
      <LegendGroup title="Risk">
        {RISK_KEYS.map((key) => (
          <span key={key.label} className="flex items-center gap-1.5 text-micro text-ink-muted">
            <span className={cn("h-2.5 w-0.5 rounded-full", key.className)} aria-hidden="true" />
            {key.label}
          </span>
        ))}
      </LegendGroup>
      <LegendGroup title="Status" className="hidden sm:flex">
        {STATUS_KEYS.map((key) => (
          <span key={key.label} className="flex items-center gap-1.5 text-micro text-ink-muted">
            <span className={cn("h-1.5 w-1.5 rounded-full", key.className)} aria-hidden="true" />
            {key.label}
          </span>
        ))}
      </LegendGroup>
      <span className="hidden items-center gap-1.5 text-micro text-ink-muted sm:flex">
        <span className="h-3 w-0.5 rounded-full bg-line-strong" aria-hidden="true" />
        Critical path
      </span>
    </div>
  );
}

function LegendGroup({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="text-micro font-semibold uppercase tracking-[0.08em] text-ink-faint">{title}</span>
      {children}
    </div>
  );
}

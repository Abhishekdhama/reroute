import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded bg-line/70", className)} />;
}

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 px-6 py-12 text-center", className)}>
      <p className="text-body font-medium text-ink">{title}</p>
      {description ? <p className="max-w-sm text-meta text-ink-faint">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title,
  detail,
  endpoint,
  action,
}: {
  title: string;
  detail?: string;
  endpoint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-panel border border-critical/25 bg-critical/5 px-6 py-12 text-center">
      <p className="text-body font-medium text-ink">{title}</p>
      {detail ? <p className="max-w-md text-meta text-ink-muted">{detail}</p> : null}
      {endpoint ? <p className="max-w-md font-mono text-micro text-ink-faint">{endpoint}</p> : null}
      {action}
    </div>
  );
}

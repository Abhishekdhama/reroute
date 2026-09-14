"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { NAV_ITEMS } from "@/lib/nav";
import { useWorkspace } from "@/lib/workspace";
import { HEALTH_LABEL, HEALTH_TONE, TONE_BG } from "@/lib/labels";
import { RerouteIcon, SearchIcon } from "@/components/ui/icons";
import { formatDate, pluralize } from "@/lib/format";

export function Sidebar({
  onNavigate,
  onOpenCommandPalette,
}: {
  onNavigate?: () => void;
  onOpenCommandPalette: () => void;
}) {
  const pathname = usePathname();
  const { workspace, status } = useWorkspace();

  return (
    <div className="flex h-full flex-col border-r border-line bg-surface">
      <div className="flex h-12 items-center gap-2 border-b border-line px-4">
        <span className="flex h-5 w-5 items-center justify-center rounded bg-brand/15 text-brand">
          <RerouteIcon width={13} height={13} />
        </span>
        <span className="text-title font-semibold tracking-tight text-ink">Reroute</span>
        <span className="ml-auto text-micro text-ink-faint">v0.1</span>
      </div>

      <div className="border-b border-line px-4 py-3">
        {status === "ready" && workspace ? (
          <>
            <p className="truncate text-body font-medium text-ink">{workspace.project.name}</p>
            <div className="mt-1.5 flex items-center gap-1.5">
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  TONE_BG[HEALTH_TONE[workspace.risk.release_health]],
                )}
                aria-hidden="true"
              />
              <span className="text-meta text-ink-muted">
                {HEALTH_LABEL[workspace.risk.release_health]}
              </span>
              <span className="text-meta text-ink-faint">·</span>
              <span className="text-meta text-ink-faint">
                Ships {formatDate(workspace.project.release_date)}
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="h-4 w-32 animate-pulse rounded bg-line" />
            <div className="mt-2 h-3 w-24 animate-pulse rounded bg-line" />
          </>
        )}
      </div>

      <nav aria-label="Primary" className="flex-1 overflow-y-auto p-2">
        <ul className="flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const badge =
              item.href === "/risks" && workspace ? workspace.signals.atRisk : undefined;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-body transition-colors",
                    active
                      ? "bg-raised text-ink"
                      : "text-ink-muted hover:bg-raised/60 hover:text-ink",
                  )}
                >
                  <item.icon
                    className={cn("shrink-0", active ? "text-brand" : "text-ink-faint group-hover:text-ink-muted")}
                    width={14}
                    height={14}
                  />
                  <span className="truncate">{item.label}</span>
                  {badge !== undefined && badge > 0 ? (
                    <span className="tnum ml-auto rounded bg-line px-1.5 py-px text-micro font-medium text-ink-muted">
                      {badge}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-line p-2">
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="flex w-full items-center gap-2 rounded-md border border-line-strong bg-raised px-2.5 py-1.5 text-meta text-ink-faint transition-colors hover:border-ink-faint/50 hover:text-ink-muted"
        >
          <SearchIcon width={13} height={13} />
          <span>Search tasks</span>
          <kbd className="ml-auto rounded border border-line-strong bg-surface px-1 font-sans text-micro text-ink-faint">
            ⌘K
          </kbd>
        </button>
        {workspace ? (
          <p className="px-2.5 pt-2 text-micro text-ink-faint">
            {pluralize(workspace.signals.totalTasks, "task")} · {workspace.signals.completed} done
          </p>
        ) : null}
      </div>
    </div>
  );
}

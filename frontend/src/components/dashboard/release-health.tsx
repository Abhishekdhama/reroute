"use client";

import { cn } from "@/lib/cn";
import { Panel } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { RefreshIcon } from "@/components/ui/icons";
import { explainRisk, normalizeCounts } from "@/lib/explain";
import { HEALTH_LABEL, HEALTH_TONE, TONE_BG, TONE_TEXT } from "@/lib/labels";
import { formatDate, formatRelativeTime, pluralize } from "@/lib/format";
import type { Workspace } from "@/lib/derive";

const ZONES = [
  { label: "On track", width: 25, className: "bg-healthy/35" },
  { label: "Watch", width: 15, className: "bg-watch/35" },
  { label: "At risk", width: 30, className: "bg-atrisk/35" },
  { label: "Critical", width: 30, className: "bg-critical/35" },
];

export function ReleaseHealth({
  workspace,
  onRefresh,
  lastAssessedAt,
  refreshing,
}: {
  workspace: Workspace;
  onRefresh: () => void;
  lastAssessedAt: string | null;
  refreshing: boolean;
}) {
  const { risk, signals, ranked, project } = workspace;
  const tone = HEALTH_TONE[risk.release_health];
  const top = ranked[0];

  return (
    <Panel className="p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className={cn("h-2 w-2 shrink-0 rounded-full", TONE_BG[tone])} aria-hidden="true" />
            <span className={cn("text-meta font-semibold uppercase tracking-[0.07em]", TONE_TEXT[tone])}>
              {HEALTH_LABEL[risk.release_health]}
            </span>
            <span className="text-meta text-ink-faint">
              Ships {formatDate(project.release_date)} · {pluralize(signals.daysToRelease, "day")} out
            </span>
          </div>

          <p className="mt-2 max-w-2xl text-title font-medium leading-snug text-ink">
            {top
              ? explainRisk(top, top.risk)
              : "No task crossed the risk threshold. The plan is holding."}
          </p>
          <p className="mt-1.5 text-meta text-ink-muted">{normalizeCounts(risk.summary)}</p>
        </div>

        <div className="flex shrink-0 items-start justify-between gap-4">
          <div className="md:text-right">
            <p className={cn("tnum text-title font-semibold leading-none", TONE_TEXT[tone])}>
              {risk.release_risk_score}
              <span className="text-micro font-normal text-ink-faint">/100</span>
            </p>
            <p className="mt-1 text-micro text-ink-faint">Release risk</p>
          </div>
          <Button
            size="sm"
            icon={<RefreshIcon width={13} height={13} />}
            onClick={onRefresh}
            loading={refreshing}
          >
            Reassess
          </Button>
        </div>
      </div>

      <div className="mt-4">
        <div className="relative flex h-1.5 w-full overflow-hidden rounded-full">
          {ZONES.map((zone) => (
            <span
              key={zone.label}
              className={cn("h-full", zone.className)}
              style={{ width: `${zone.width}%` }}
              aria-hidden="true"
            />
          ))}
          <span
            className={cn("absolute top-1/2 h-3 w-0.5 -translate-y-1/2 rounded-full", TONE_BG[tone])}
            style={{ left: `calc(${Math.min(100, risk.release_risk_score)}% - 1px)` }}
            aria-hidden="true"
          />
        </div>
        <div className="mt-1.5 flex justify-between text-micro text-ink-faint">
          {ZONES.map((zone) => (
            <span key={zone.label}>{zone.label}</span>
          ))}
        </div>
      </div>

      {lastAssessedAt ? (
        <p className="mt-3 text-micro text-ink-faint">
          Assessed {formatRelativeTime(lastAssessedAt)} by the Reroute risk engine
        </p>
      ) : null}
    </Panel>
  );
}

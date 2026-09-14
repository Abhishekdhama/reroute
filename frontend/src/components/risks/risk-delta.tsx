import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/badge";
import { ChevronRightIcon } from "@/components/ui/icons";
import { normalizeCounts } from "@/lib/explain";
import { pluralize } from "@/lib/format";
import { BAND_LABEL, BAND_TONE, HEALTH_LABEL, HEALTH_TONE } from "@/lib/labels";
import type { ReassessmentEvent } from "@/lib/workspace";

export function RiskDelta({ event, compact = false }: { event: ReassessmentEvent; compact?: boolean }) {
  const { before, after } = event;
  const resolved = before.taskFactors.filter((factor) => !after.taskFactors.includes(factor));
  const introduced = after.taskFactors.filter((factor) => !before.taskFactors.includes(factor));
  const scoreDelta = after.taskScore - before.taskScore;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-2">
        <DeltaCell
          label="Release health"
          before={
            <Badge tone={HEALTH_TONE[before.releaseHealth]}>{HEALTH_LABEL[before.releaseHealth]}</Badge>
          }
          after={
            <Badge tone={HEALTH_TONE[after.releaseHealth]}>{HEALTH_LABEL[after.releaseHealth]}</Badge>
          }
          note={`Release risk ${before.releaseScore} → ${after.releaseScore} · ${pluralize(after.atRiskCount, "task")} still at risk`}
        />
        <DeltaCell
          label="Task risk"
          before={<Badge tone={BAND_TONE[before.taskBand]}>{before.taskScore} {BAND_LABEL[before.taskBand]}</Badge>}
          after={<Badge tone={BAND_TONE[after.taskBand]}>{after.taskScore} {BAND_LABEL[after.taskBand]}</Badge>}
          note={
            scoreDelta === 0
              ? `${event.taskTitle} unchanged`
              : `${event.taskTitle} ${scoreDelta > 0 ? "up" : "down"} ${pluralize(Math.abs(scoreDelta), "point")}`
          }
        />
      </div>

      {compact ? null : (
        <div className="grid gap-3 sm:grid-cols-2">
          <FactorList title="No longer flagged" factors={resolved} tone="healthy" />
          <FactorList title="Still flagged or new" factors={after.taskFactors} tone="atrisk" highlight={introduced} />
        </div>
      )}
    </div>
  );
}

function DeltaCell({
  label,
  before,
  after,
  note,
}: {
  label: string;
  before: React.ReactNode;
  after: React.ReactNode;
  note: string;
}) {
  return (
    <div className="bg-surface px-3 py-2.5">
      <p className="truncate text-micro uppercase tracking-[0.06em] text-ink-faint">{label}</p>
      <div className="mt-1.5 flex items-center gap-2">
        <span className="opacity-60">{before}</span>
        <ChevronRightIcon width={11} height={11} className="shrink-0 text-ink-faint" />
        {after}
      </div>
      <p className="mt-1.5 text-micro text-ink-faint">{note}</p>
    </div>
  );
}

function FactorList({
  title,
  factors,
  tone,
  highlight = [],
}: {
  title: string;
  factors: string[];
  tone: "healthy" | "atrisk";
  highlight?: string[];
}) {
  return (
    <div>
      <p className="text-micro font-semibold uppercase tracking-[0.08em] text-ink-faint">{title}</p>
      {factors.length === 0 ? (
        <p className="mt-1.5 text-meta text-ink-faint">None</p>
      ) : (
        <ul className="mt-1.5 flex flex-col gap-1">
          {factors.map((factor) => (
            <li key={factor} className="flex items-start gap-1.5 text-meta leading-snug">
              <span
                className={cn(
                  "mt-1.5 h-1 w-1 shrink-0 rounded-full",
                  tone === "healthy" ? "bg-healthy" : "bg-atrisk",
                )}
                aria-hidden="true"
              />
              <span className={cn(highlight.includes(factor) ? "text-ink" : "text-ink-muted")}>
                {normalizeCounts(factor)}
                {highlight.includes(factor) ? <span className="ml-1 text-micro text-ink-faint">new</span> : null}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

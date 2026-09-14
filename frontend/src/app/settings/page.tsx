"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Button, Spinner } from "@/components/ui/button";
import { RefreshIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { checkHealth } from "@/lib/api";
import { useWorkspace } from "@/lib/workspace";
import { formatDate, formatRelativeTime, pluralize } from "@/lib/format";

export default function SettingsPage() {
  const { workspace, reset, refresh, lastAssessedAt, isAssessing } = useWorkspace();
  const [health, setHealth] = useState<{ ok: boolean; baseUrl: string; message: string } | null>(null);
  const [checking, setChecking] = useState(true);

  const runCheck = useCallback(async () => {
    setChecking(true);
    setHealth(await checkHealth());
    setChecking(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    checkHealth().then((result) => {
      if (cancelled) return;
      setHealth(result);
      setChecking(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <PageHeader title="Settings" description="API connection and demo workspace" />

      <div className="flex max-w-3xl flex-col gap-4 p-4 md:p-6">
        <Panel>
          <PanelHeader
            title="Risk engine connection"
            description="All scores, blast radius and interventions come from this service"
            action={
              <Button size="sm" icon={<RefreshIcon width={13} height={13} />} onClick={runCheck} loading={checking}>
                Check
              </Button>
            }
          />
          <dl className="divide-y divide-line">
            <Row label="Status">
              {checking ? (
                <span className="flex items-center gap-2 text-meta text-ink-muted">
                  <Spinner className="h-3 w-3" /> Checking
                </span>
              ) : (
                <span className="flex items-center gap-2 text-meta">
                  <span
                    className={cn("h-1.5 w-1.5 rounded-full", health?.ok ? "bg-healthy" : "bg-critical")}
                    aria-hidden="true"
                  />
                  <span className={health?.ok ? "text-healthy" : "text-critical"}>
                    {health?.ok ? "Connected" : "Unavailable"}
                  </span>
                </span>
              )}
            </Row>
            <Row label="Endpoint">
              <span className="font-mono text-meta text-ink-muted">{health?.baseUrl ?? "—"}</span>
            </Row>
            <Row label="Last assessment">
              <span className="text-meta text-ink-muted">
                {lastAssessedAt ? formatRelativeTime(lastAssessedAt) : "Not yet run"}
              </span>
            </Row>
            {!health?.ok && !checking ? (
              <Row label="Detail">
                <span className="text-meta text-ink-muted">{health?.message}</span>
              </Row>
            ) : null}
          </dl>
        </Panel>

        <Panel>
          <PanelHeader
            title="Workspace"
            description="The release plan posted to the risk engine on every assessment"
          />
          <dl className="divide-y divide-line">
            <Row label="Project">
              <span className="text-meta text-ink-muted">{workspace?.project.name ?? "—"}</span>
            </Row>
            <Row label="Release date">
              <span className="text-meta text-ink-muted">
                {workspace ? formatDate(workspace.project.release_date) : "—"}
              </span>
            </Row>
            <Row label="Tasks">
              <span className="text-meta text-ink-muted">
                {workspace ? pluralize(workspace.tasks.length, "task") : "—"}
              </span>
            </Row>
          </dl>
          <div className="flex flex-wrap gap-2 border-t border-line px-4 py-3">
            <Button size="sm" onClick={refresh} loading={isAssessing}>
              Re-run assessment
            </Button>
            <Button size="sm" variant="danger" onClick={reset}>
              Reset workspace
            </Button>
          </div>
          <p className="px-4 pb-3 text-micro text-ink-faint">
            Resetting restores the original plan and clears reassessments recorded in this session.
          </p>
        </Panel>
      </div>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2.5">
      <dt className="text-meta text-ink-faint">{label}</dt>
      <dd className="min-w-0 text-right">{children}</dd>
    </div>
  );
}

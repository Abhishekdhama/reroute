"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Button, Spinner } from "@/components/ui/button";
import { CheckIcon, RefreshIcon, UploadIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { checkHealth } from "@/lib/api";
import { useWorkspace } from "@/lib/workspace";
import { formatDate, formatRelativeTime, pluralize } from "@/lib/format";

type UploadState =
  | { kind: "idle" }
  | { kind: "error"; message: string }
  | { kind: "success"; projectName: string; taskCount: number };

export default function SettingsPage() {
  const { workspace, reset, refresh, lastAssessedAt, isAssessing, isUploading, uploadCsv } = useWorkspace();
  const [health, setHealth] = useState<{ ok: boolean; baseUrl: string; message: string } | null>(null);
  const [checking, setChecking] = useState(true);
  const [uploadState, setUploadState] = useState<UploadState>({ kind: "idle" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelected = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;
      setUploadState({ kind: "idle" });
      try {
        const { projectName, taskCount } = await uploadCsv(file);
        setUploadState({ kind: "success", projectName, taskCount });
      } catch (cause) {
        setUploadState({ kind: "error", message: cause instanceof Error ? cause.message : "Upload failed." });
      }
    },
    [uploadCsv],
  );

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
            <Button size="sm" variant="secondary" onClick={reset}>
              Reset workspace
            </Button>
          </div>
          <p className="px-4 pb-3 text-micro text-ink-faint">
            Resetting restores the original plan and clears reassessments recorded in this session.
          </p>
        </Panel>

        <Panel>
          <PanelHeader
            title="Import"
            description="Upload a task CSV to replace the active workspace with its assessed risk"
          />
          <div className="flex flex-wrap items-center gap-3 px-4 py-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={handleFileSelected}
              aria-label="Upload task CSV"
            />
            <Button
              size="sm"
              icon={<UploadIcon width={13} height={13} />}
              loading={isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              Upload CSV
            </Button>
            {uploadState.kind === "success" ? (
              <span className="flex items-center gap-1.5 text-meta text-healthy">
                <CheckIcon width={13} height={13} />
                Loaded &ldquo;{uploadState.projectName}&rdquo; · {pluralize(uploadState.taskCount, "task")}
              </span>
            ) : uploadState.kind === "error" ? (
              <span className="text-meta text-critical">{uploadState.message}</span>
            ) : (
              <span className="text-micro text-ink-faint">
                task_id, title, owner, status, priority, due_date, progress, dependencies, latest_update,
                last_updated_at
              </span>
            )}
          </div>
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

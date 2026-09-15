"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ApiError, assessProject, reassessAfterReply, uploadProjectCsv } from "@/lib/api";
import { CsvParseError, parseProjectCsv } from "@/lib/csv";
import { bandForScore, deriveWorkspace, type Workspace } from "@/lib/derive";
import { buildSeedProject } from "@/lib/seed";
import type { Project, ProjectRisk, ReleaseHealth, RiskBand, UnblockReply } from "@/types/reroute";

export type { AssessmentError };

export interface RiskSnapshot {
  releaseScore: number;
  releaseHealth: ReleaseHealth;
  atRiskCount: number;
  taskScore: number;
  taskBand: RiskBand;
  taskFactors: string[];
  downstreamCount: number;
}

export interface ReassessmentEvent {
  id: string;
  taskId: string;
  taskTitle: string;
  reply: UnblockReply;
  before: RiskSnapshot;
  after: RiskSnapshot;
  at: string;
}

type Status = "loading" | "ready" | "error";

interface WorkspaceContextValue {
  status: Status;
  error: AssessmentError | null;
  workspace: Workspace | null;
  history: ReassessmentEvent[];
  selectedTaskId: string | null;
  isAssessing: boolean;
  isReassessing: boolean;
  isUploading: boolean;
  lastAssessedAt: string | null;
  selectTask: (taskId: string | null) => void;
  refresh: () => void;
  reset: () => void;
  submitReply: (reply: UnblockReply) => Promise<ReassessmentEvent>;
  uploadCsv: (file: File) => Promise<{ projectName: string; taskCount: number }>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

function snapshot(risk: ProjectRisk, taskId: string): RiskSnapshot {
  const entry = risk.at_risk_tasks.find((item) => item.task_id === taskId);
  const score = entry?.score ?? 0;
  return {
    releaseScore: risk.release_risk_score,
    releaseHealth: risk.release_health,
    atRiskCount: risk.at_risk_tasks.length,
    taskScore: score,
    taskBand: bandForScore(score),
    taskFactors: entry?.factors ?? [],
    downstreamCount: entry?.downstream_task_ids.length ?? 0,
  };
}

interface AssessmentError {
  message: string;
  endpoint: string | null;
}

function toError(cause: unknown): AssessmentError {
  if (cause instanceof ApiError) return { message: cause.message, endpoint: cause.endpoint };
  return { message: "The assessment request failed.", endpoint: null };
}

function toUploadMessage(cause: unknown): string {
  if (cause instanceof CsvParseError) return cause.message;
  if (cause instanceof ApiError) return cause.message;
  return "The file could not be uploaded.";
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [initialProject] = useState(buildSeedProject);
  const [project, setProject] = useState<Project>(initialProject);
  const [risk, setRisk] = useState<ProjectRisk | null>(null);
  const [error, setError] = useState<AssessmentError | null>(null);
  const [isAssessing, setIsAssessing] = useState(true);
  const [isReassessing, setIsReassessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [history, setHistory] = useState<ReassessmentEvent[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [lastAssessedAt, setLastAssessedAt] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    assessProject(initialProject, controller.signal)
      .then((result) => {
        setRisk(result);
        setLastAssessedAt(new Date().toISOString());
        setIsAssessing(false);
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setError(toError(cause));
        setIsAssessing(false);
      });
    return () => controller.abort();
  }, [initialProject]);

  const assess = useCallback(async (target: Project) => {
    setIsAssessing(true);
    setError(null);
    try {
      const result = await assessProject(target);
      setRisk(result);
      setLastAssessedAt(new Date().toISOString());
    } catch (cause) {
      setError(toError(cause));
    } finally {
      setIsAssessing(false);
    }
  }, []);

  const refresh = useCallback(() => {
    void assess(project);
  }, [assess, project]);

  const reset = useCallback(() => {
    const fresh = buildSeedProject();
    setProject(fresh);
    setHistory([]);
    setSelectedTaskId(null);
    void assess(fresh);
  }, [assess]);

  const uploadCsv = useCallback(async (file: File) => {
    // Parsed client-side for display only; the backend's assessment below is what
    // actually decides the numbers. If the file doesn't even parse, don't spend a
    // request on it.
    let parsed: Project;
    try {
      parsed = parseProjectCsv(await file.text(), file.name);
    } catch (cause) {
      throw new Error(toUploadMessage(cause));
    }

    setIsUploading(true);
    try {
      const result = await uploadProjectCsv(file);
      setProject(parsed);
      setRisk(result);
      setHistory([]);
      setSelectedTaskId(null);
      setError(null);
      setLastAssessedAt(new Date().toISOString());
      return { projectName: parsed.name, taskCount: parsed.tasks.length };
    } catch (cause) {
      throw new Error(toUploadMessage(cause));
    } finally {
      setIsUploading(false);
    }
  }, []);

  const submitReply = useCallback(
    async (reply: UnblockReply) => {
      if (!risk) throw new ApiError("No assessment is loaded yet.", 0);
      setIsReassessing(true);
      try {
        const result = await reassessAfterReply(project, reply);
        const task = result.project.tasks.find((item) => item.task_id === reply.task_id);
        const event: ReassessmentEvent = {
          id: `${reply.task_id}-${reply.responded_at}`,
          taskId: reply.task_id,
          taskTitle: task?.title ?? reply.task_id,
          reply,
          before: snapshot(risk, reply.task_id),
          after: snapshot(result.risk, reply.task_id),
          at: new Date().toISOString(),
        };
        setProject(result.project);
        setRisk(result.risk);
        setLastAssessedAt(new Date().toISOString());
        setHistory((entries) => [event, ...entries]);
        return event;
      } finally {
        setIsReassessing(false);
      }
    },
    [project, risk],
  );

  const workspace = useMemo(() => (risk ? deriveWorkspace(project, risk) : null), [project, risk]);
  const status: Status = error ? "error" : workspace ? "ready" : "loading";

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      status,
      error,
      workspace,
      history,
      selectedTaskId,
      isAssessing,
      isReassessing,
      isUploading,
      lastAssessedAt,
      selectTask: setSelectedTaskId,
      refresh,
      reset,
      submitReply,
      uploadCsv,
    }),
    [
      status,
      error,
      workspace,
      history,
      selectedTaskId,
      isAssessing,
      isReassessing,
      isUploading,
      lastAssessedAt,
      refresh,
      reset,
      submitReply,
      uploadCsv,
    ],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceContextValue {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return context;
}

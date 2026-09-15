import type { Project, ProjectRisk, Reassessment, UnblockReply } from "@/types/reroute";

export class ApiError extends Error {
  readonly status: number;
  readonly endpoint: string | null;

  constructor(message: string, status: number, endpoint: string | null = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.endpoint = endpoint;
  }
}

async function post<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError("Could not reach the Reroute API.", 0);
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(
      readDetail(payload) ?? `Request failed (${response.status}).`,
      response.status,
      describeEndpoint(payload),
    );
  }
  return payload as T;
}

function describeEndpoint(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const { base_url: baseUrl, path, upstream_status: status } = payload as Record<string, unknown>;
  if (typeof baseUrl !== "string") return null;
  const suffix = typeof status === "number" ? ` · HTTP ${status}` : "";
  return `${baseUrl}${typeof path === "string" ? path : ""}${suffix}`;
}

function readDetail(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const detail = (payload as { detail?: unknown }).detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0] as { msg?: string; loc?: unknown[] };
    if (first?.msg) return `${first.msg}${first.loc ? ` (${first.loc.join(".")})` : ""}`;
  }
  return null;
}

export function assessProject(project: Project, signal?: AbortSignal): Promise<ProjectRisk> {
  return post<ProjectRisk>("/api/assess", project, signal);
}

export async function uploadProjectCsv(file: File, signal?: AbortSignal): Promise<ProjectRisk> {
  const formData = new FormData();
  formData.append("file", file);

  let response: Response;
  try {
    response = await fetch("/api/upload", { method: "POST", body: formData, signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError("Could not reach the Reroute API.", 0);
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(
      readDetail(payload) ?? `Upload failed (${response.status}).`,
      response.status,
      describeEndpoint(payload),
    );
  }
  return payload as ProjectRisk;
}

export function reassessAfterReply(
  project: Project,
  reply: UnblockReply,
  signal?: AbortSignal,
): Promise<Reassessment> {
  return post<Reassessment>("/api/reassess", { project, reply }, signal);
}

export interface HealthResponse {
  status?: string;
  base_url: string;
  detail?: string;
}

export async function checkHealth(): Promise<{ ok: boolean; baseUrl: string; message: string }> {
  try {
    const response = await fetch("/api/health", { cache: "no-store" });
    const payload = (await response.json()) as HealthResponse;
    return {
      ok: response.ok && payload.status === "ok",
      baseUrl: payload.base_url ?? "unknown",
      message: response.ok ? "Connected" : (payload.detail ?? "Unavailable"),
    };
  } catch {
    return { ok: false, baseUrl: "unknown", message: "Could not reach the Next.js API route." };
  }
}

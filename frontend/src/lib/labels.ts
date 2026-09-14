import type { Priority, ReleaseHealth, RiskBand, TaskStatus } from "@/types/reroute";

export const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "Not started",
  in_progress: "In progress",
  blocked: "Blocked",
  done: "Done",
};

export const STATUS_DOT: Record<TaskStatus, string> = {
  todo: "bg-ink-faint",
  in_progress: "bg-brand",
  blocked: "bg-critical",
  done: "bg-healthy",
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const PRIORITY_RANK: Record<Priority, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

export const HEALTH_LABEL: Record<ReleaseHealth, string> = {
  on_track: "On track",
  watch: "Watch",
  at_risk: "At risk",
  critical: "Critical",
};

export const HEALTH_TONE: Record<ReleaseHealth, "healthy" | "watch" | "atrisk" | "critical"> = {
  on_track: "healthy",
  watch: "watch",
  at_risk: "atrisk",
  critical: "critical",
};

export const BAND_LABEL: Record<RiskBand, string> = {
  critical: "Critical",
  at_risk: "At risk",
  watch: "Watch",
  stable: "Stable",
};

export type Tone = "healthy" | "watch" | "atrisk" | "critical" | "neutral" | "brand";

export const BAND_TONE: Record<RiskBand, Tone> = {
  critical: "critical",
  at_risk: "atrisk",
  watch: "watch",
  stable: "neutral",
};

export const TONE_TEXT: Record<Tone, string> = {
  healthy: "text-healthy",
  watch: "text-watch",
  atrisk: "text-atrisk",
  critical: "text-critical",
  neutral: "text-ink-muted",
  brand: "text-brand",
};

export const TONE_BG: Record<Tone, string> = {
  healthy: "bg-healthy",
  watch: "bg-watch",
  atrisk: "bg-atrisk",
  critical: "bg-critical",
  neutral: "bg-line-strong",
  brand: "bg-brand",
};

export const TONE_SOFT: Record<Tone, string> = {
  healthy: "bg-healthy/10 text-healthy border-healthy/25",
  watch: "bg-watch/10 text-watch border-watch/25",
  atrisk: "bg-atrisk/10 text-atrisk border-atrisk/25",
  critical: "bg-critical/10 text-critical border-critical/25",
  neutral: "bg-line/60 text-ink-muted border-line-strong",
  brand: "bg-brand/10 text-brand border-brand/25",
};

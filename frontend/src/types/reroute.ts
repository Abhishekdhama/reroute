export type TaskStatus = "todo" | "in_progress" | "blocked" | "done";
export type Priority = "low" | "medium" | "high" | "critical";
export type ReleaseHealth = "on_track" | "watch" | "at_risk" | "critical";

export interface Task {
  task_id: string;
  title: string;
  owner: string;
  status: TaskStatus;
  priority: Priority;
  /** ISO date, YYYY-MM-DD */
  due_date: string;
  progress: number;
  dependencies: string[];
  latest_update: string;
  /** ISO datetime with timezone offset */
  last_updated_at: string;
}

export interface Project {
  project_id: string;
  name: string;
  release_date: string;
  tasks: Task[];
}

export interface TaskRisk {
  task_id: string;
  score: number;
  factors: string[];
  downstream_task_ids: string[];
  suggested_question: string | null;
  recommended_intervention: string;
}

export interface ProjectRisk {
  project_id: string;
  release_risk_score: number;
  release_health: ReleaseHealth;
  summary: string;
  at_risk_tasks: TaskRisk[];
}

export interface UnblockReply {
  task_id: string;
  new_status: TaskStatus;
  revised_due_date: string | null;
  progress: number | null;
  update: string;
  responded_at: string;
}

export interface Reassessment {
  project: Project;
  risk: ProjectRisk;
}

/** Task risk banding, aligned with the backend's release-health thresholds. */
export type RiskBand = "critical" | "at_risk" | "watch" | "stable";

export interface TaskView extends Task {
  risk: TaskRisk | null;
  band: RiskBand;
  score: number;
  /** Tasks that declare this task as a prerequisite. */
  dependents: string[];
  /** Every task reachable downstream. Backend-provided when the task is at risk. */
  downstream: string[];
  blockedByIncomplete: string[];
  onCriticalPath: boolean;
  daysToDue: number;
  isOverdue: boolean;
}

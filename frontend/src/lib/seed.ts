import type { Project, Priority, Task, TaskStatus } from "@/types/reroute";
import { startOfDay, toIsoDate } from "@/lib/format";

interface SeedTask {
  task_id: string;
  title: string;
  owner: string;
  status: TaskStatus;
  priority: Priority;
  dueInDays: number;
  progress: number;
  dependencies: string[];
  latest_update: string;
  updatedHoursAgo: number;
}

const SEED_TASKS: SeedTask[] = [
  {
    task_id: "PAY-101",
    title: "Payments data model migration",
    owner: "Daniel Okafor",
    status: "done",
    priority: "high",
    dueInDays: -6,
    progress: 100,
    dependencies: [],
    latest_update: "Migration shipped to production. Backfill verified against settlement exports.",
    updatedHoursAgo: 132,
  },
  {
    task_id: "PAY-104",
    title: "Payment service API",
    owner: "Priya Raghavan",
    status: "blocked",
    priority: "critical",
    dueInDays: -1,
    progress: 55,
    dependencies: ["PAY-101"],
    latest_update:
      "Refund webhooks cannot be verified until the provider issues sandbox credentials. Ticket raised with their support team, no ETA yet.",
    updatedHoursAgo: 74,
  },
  {
    task_id: "PAY-118",
    title: "Checkout UI",
    owner: "Mei Lin Chen",
    status: "in_progress",
    priority: "high",
    dueInDays: 2,
    progress: 45,
    dependencies: ["PAY-104"],
    latest_update: "Card and wallet flows are built. Refund states are stubbed pending the API contract.",
    updatedHoursAgo: 20,
  },
  {
    task_id: "PAY-121",
    title: "Refund flow",
    owner: "Arjun Mehta",
    status: "todo",
    priority: "high",
    dueInDays: 4,
    progress: 0,
    dependencies: ["PAY-104"],
    latest_update: "Not started. Waiting on the refund webhook contract.",
    updatedHoursAgo: 20,
  },
  {
    task_id: "PAY-126",
    title: "Billing dashboard",
    owner: "Sofia Alvarez",
    status: "in_progress",
    priority: "medium",
    dueInDays: 5,
    progress: 30,
    dependencies: ["PAY-118"],
    latest_update: "Invoice table and filters are in review. Charts blocked on checkout events.",
    updatedHoursAgo: 28,
  },
  {
    task_id: "AUTH-212",
    title: "Authentication service upgrade",
    owner: "Tomas Weber",
    status: "in_progress",
    priority: "critical",
    dueInDays: 2,
    progress: 70,
    dependencies: [],
    latest_update: "Token rotation is deployed to staging. Load test scheduled for tomorrow morning.",
    updatedHoursAgo: 9,
  },
  {
    task_id: "AUTH-219",
    title: "Session migration",
    owner: "Priya Raghavan",
    status: "todo",
    priority: "high",
    dueInDays: 3,
    progress: 10,
    dependencies: ["AUTH-212"],
    latest_update: "Runbook drafted. Cutover window still needs sign-off from support.",
    updatedHoursAgo: 52,
  },
  {
    task_id: "RISK-308",
    title: "Fraud rules engine",
    owner: "Ines Costa",
    status: "blocked",
    priority: "high",
    dueInDays: 4,
    progress: 25,
    dependencies: ["PAY-104"],
    latest_update: "Rule thresholds need risk-team sign-off before we can score live transactions.",
    updatedHoursAgo: 46,
  },
  {
    task_id: "DATA-402",
    title: "Analytics pipeline",
    owner: "Daniel Okafor",
    status: "in_progress",
    priority: "medium",
    dueInDays: 6,
    progress: 40,
    dependencies: ["PAY-118"],
    latest_update: "Checkout event schema agreed. Backfill job is running against the staging warehouse.",
    updatedHoursAgo: 14,
  },
  {
    task_id: "DATA-408",
    title: "Merchant settlement report",
    owner: "Sofia Alvarez",
    status: "todo",
    priority: "medium",
    dueInDays: 8,
    progress: 0,
    dependencies: ["DATA-402"],
    latest_update: "Report spec approved by finance. Build starts once pipeline events land.",
    updatedHoursAgo: 36,
  },
  {
    task_id: "PAY-133",
    title: "Payment provider failover",
    owner: "Tomas Weber",
    status: "todo",
    priority: "high",
    dueInDays: 7,
    progress: 0,
    dependencies: ["PAY-104"],
    latest_update: "Secondary provider account is ready. Routing work not started.",
    updatedHoursAgo: 40,
  },
  {
    task_id: "GOV-501",
    title: "Compliance audit trail",
    owner: "Ines Costa",
    status: "in_progress",
    priority: "medium",
    dueInDays: 9,
    progress: 20,
    dependencies: ["PAY-101"],
    latest_update: "Event taxonomy drafted with legal. Retention policy under review.",
    updatedHoursAgo: 30,
  },
  {
    task_id: "REL-600",
    title: "Release validation",
    owner: "Kenji Watanabe",
    status: "todo",
    priority: "critical",
    dueInDays: 10,
    progress: 0,
    dependencies: ["PAY-121", "AUTH-219", "RISK-308", "DATA-402"],
    latest_update: "Test plan drafted. Environment reserved for the validation window.",
    updatedHoursAgo: 18,
  },
  {
    task_id: "REL-604",
    title: "Customer comms and rollout plan",
    owner: "Mei Lin Chen",
    status: "todo",
    priority: "low",
    dueInDays: 11,
    progress: 0,
    dependencies: ["REL-600"],
    latest_update: "Draft announcement written. Waiting on a confirmed rollout date.",
    updatedHoursAgo: 22,
  },
];

function shiftDays(base: Date, days: number): string {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return toIsoDate(next);
}

/**
 * The backend scores against the real calendar, so the demo workspace is generated
 * relative to today rather than pinned to fixed dates that would go stale.
 */
export function buildSeedProject(now = new Date()): Project {
  const today = startOfDay(now);
  const tasks: Task[] = SEED_TASKS.map((seed) => ({
    task_id: seed.task_id,
    title: seed.title,
    owner: seed.owner,
    status: seed.status,
    priority: seed.priority,
    due_date: shiftDays(today, seed.dueInDays),
    progress: seed.progress,
    dependencies: seed.dependencies,
    latest_update: seed.latest_update,
    last_updated_at: new Date(now.getTime() - seed.updatedHoursAgo * 3_600_000).toISOString(),
  }));

  return {
    project_id: "payments-4-2",
    name: "Payments Release 4.2",
    release_date: shiftDays(today, 12),
    tasks,
  };
}

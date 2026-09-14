import type { Task, TaskRisk } from "@/types/reroute";

/** Backend copy carries "(s)" placeholders; resolve them against the count in the phrase. */
export function normalizeCounts(text: string): string {
  return text.replace(
    /(\d+)\s+((?:[\w-]+\s+)*)([\w-]+)\(s\)/g,
    (_match, count: string, middle: string, noun: string) =>
      `${count} ${middle}${noun}${Number(count) === 1 ? "" : "s"}`,
  );
}

interface Clause {
  text: string;
  /** Whether "is" can be dropped when the clause follows another "is" clause. */
  elidable: boolean;
}

const CLAUSE_REWRITES: Array<[RegExp, string, boolean]> = [
  [/^Task is /, "is ", true],
  [/^Overdue /, "is overdue ", true],
  [/^Due within /, "is due within ", true],
  [/^In progress /, "is in progress ", true],
  [/^Not started /, "is not started ", true],
  [/^No update for /, "has had no update for ", false],
  [/^Low progress close to deadline$/, "has low progress this close to its deadline", false],
  [/^Blocks /, "blocks ", false],
];

function toClause(factor: string): Clause {
  const normalized = normalizeCounts(factor);
  for (const [pattern, replacement, elidable] of CLAUSE_REWRITES) {
    if (pattern.test(normalized)) return { text: normalized.replace(pattern, replacement), elidable };
  }
  return { text: `is ${normalized.charAt(0).toLowerCase()}${normalized.slice(1)}`, elidable: false };
}

function weight(factor: string): number {
  if (factor.startsWith("Task is")) return 0;
  if (factor.startsWith("Overdue")) return 1;
  if (factor.startsWith("Due within")) return 2;
  if (factor.startsWith("Blocks")) return 3;
  if (factor.startsWith("Not started") || factor.startsWith("In progress")) return 4;
  if (factor.startsWith("No update")) return 5;
  return 6;
}

function joinClauses(clauses: string[]): string {
  if (clauses.length === 1) return clauses[0];
  if (clauses.length === 2) return `${clauses[0]} and ${clauses[1]}`;
  return `${clauses.slice(0, -1).join(", ")}, and ${clauses[clauses.length - 1]}`;
}

/**
 * Turns the backend's scoring factors into the sentence a project lead reads first.
 * The score supports this explanation rather than replacing it.
 */
export function explainRisk(task: Task, risk: TaskRisk | null, maxClauses = 3): string {
  if (!risk || risk.factors.length === 0) {
    return `${task.title} shows no material delivery risk signals.`;
  }
  const clauses = [...risk.factors]
    .sort((a, b) => weight(a) - weight(b))
    .slice(0, maxClauses)
    .map(toClause);

  const [first, ...rest] = clauses;
  const text = rest.map((clause) =>
    first.text.startsWith("is ") && clause.elidable && clause.text.startsWith("is ")
      ? clause.text.slice(3)
      : clause.text,
  );

  return `${task.title} ${joinClauses([first.text, ...text])}.`;
}

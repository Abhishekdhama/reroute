"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { NAV_ITEMS } from "@/lib/nav";
import { useWorkspace } from "@/lib/workspace";
import { BAND_TONE, STATUS_LABEL, TONE_BG } from "@/lib/labels";

interface Command {
  id: string;
  label: string;
  hint: string;
  group: "Navigate" | "Tasks" | "Actions";
  tone?: string;
  run: () => void;
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return <Palette onClose={onClose} />;
}

function Palette({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { workspace, selectTask, refresh, reset } = useWorkspace();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const commands = useMemo<Command[]>(() => {
    const navigation: Command[] = NAV_ITEMS.map((item) => ({
      id: `nav:${item.href}`,
      label: item.label,
      hint: item.description,
      group: "Navigate",
      run: () => router.push(item.href),
    }));

    const tasks: Command[] = (workspace?.tasks ?? []).map((task) => ({
      id: `task:${task.task_id}`,
      label: `${task.task_id} · ${task.title}`,
      hint: `${task.owner} · ${STATUS_LABEL[task.status]}`,
      group: "Tasks",
      tone: TONE_BG[BAND_TONE[task.band]],
      run: () => {
        selectTask(task.task_id);
        router.push(task.risk ? "/risks" : "/tasks");
      },
    }));

    const actions: Command[] = [
      {
        id: "action:reassess",
        label: "Reassess project",
        hint: "Re-run the risk assessment against the API",
        group: "Actions",
        run: refresh,
      },
      {
        id: "action:reset",
        label: "Reset workspace",
        hint: "Restore the original release plan",
        group: "Actions",
        run: reset,
      },
    ];

    return [...navigation, ...tasks, ...actions];
  }, [router, workspace, selectTask, refresh, reset]);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return commands;
    return commands.filter((command) =>
      `${command.label} ${command.hint}`.toLowerCase().includes(needle),
    );
  }, [commands, query]);

  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, results]);

  if (typeof document === "undefined") return null;

  const select = (index: number) => {
    const command = results[index];
    if (!command) return;
    onClose();
    command.run();
  };

  let lastGroup = "";

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[12vh]">
      <div className="fixed inset-0 bg-base/75" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="relative w-full max-w-lg overflow-hidden rounded-panel border border-line-strong bg-surface shadow-2xl shadow-black/50"
      >
        <input
          autoFocus
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActiveIndex((index) => (index + 1) % Math.max(results.length, 1));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((index) => (index - 1 + results.length) % Math.max(results.length, 1));
            } else if (event.key === "Enter") {
              event.preventDefault();
              select(activeIndex);
            } else if (event.key === "Escape") {
              onClose();
            }
          }}
          placeholder="Search tasks, pages and actions…"
          aria-label="Search tasks, pages and actions"
          aria-expanded="true"
          role="combobox"
          aria-controls="command-results"
          className="w-full border-b border-line bg-transparent px-4 py-3 text-body text-ink placeholder:text-ink-faint focus:border-brand focus-visible:outline-none"
        />
        <ul ref={listRef} id="command-results" role="listbox" className="max-h-80 overflow-y-auto p-1.5">
          {results.length === 0 ? (
            <li className="px-3 py-6 text-center text-meta text-ink-faint">No matches</li>
          ) : (
            results.map((command, index) => {
              const showGroup = command.group !== lastGroup;
              lastGroup = command.group;
              return (
                <li key={command.id}>
                  {showGroup ? (
                    <p className="px-2.5 pb-1 pt-2 text-micro font-semibold uppercase tracking-[0.08em] text-ink-faint">
                      {command.group}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    role="option"
                    aria-selected={index === activeIndex}
                    data-active={index === activeIndex}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => select(index)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left transition-colors",
                      index === activeIndex ? "bg-raised" : "hover:bg-raised/60",
                    )}
                  >
                    {command.tone ? (
                      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", command.tone)} />
                    ) : (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-line-strong" />
                    )}
                    <span className="min-w-0 flex-1 truncate text-body text-ink">{command.label}</span>
                    <span className="hidden shrink-0 text-micro text-ink-faint sm:block">{command.hint}</span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>,
    document.body,
  );
}

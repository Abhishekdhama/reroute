"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Select, TextArea, TextInput } from "@/components/ui/field";
import { CopyIcon } from "@/components/ui/icons";
import { RiskDelta } from "@/components/risks/risk-delta";
import { useWorkspace, type ReassessmentEvent } from "@/lib/workspace";
import { STATUS_LABEL } from "@/lib/labels";
import { pluralize } from "@/lib/format";
import { ApiError } from "@/lib/api";
import { normalizeCounts } from "@/lib/explain";
import type { TaskStatus, TaskView } from "@/types/reroute";

type Step = "ask" | "reply" | "result";

const STATUS_OPTIONS: TaskStatus[] = ["todo", "in_progress", "blocked", "done"];

export function ReassessDialog({
  task,
  open,
  onClose,
}: {
  task: TaskView;
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  return <ReassessFlow task={task} onClose={onClose} />;
}

function ReassessFlow({ task, onClose }: { task: TaskView; onClose: () => void }) {
  const { submitReply, isReassessing } = useWorkspace();
  const question = task.risk?.suggested_question ? normalizeCounts(task.risk.suggested_question) : null;
  const [step, setStep] = useState<Step>(question ? "ask" : "reply");
  const [status, setStatus] = useState<TaskStatus>(task.status === "blocked" ? "in_progress" : task.status);
  const [dueDate, setDueDate] = useState(task.due_date);
  const [progress, setProgress] = useState(String(task.progress));
  const [update, setUpdate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [event, setEvent] = useState<ReassessmentEvent | null>(null);

  const submit = async () => {
    if (update.trim().length === 0) {
      setError("Add the owner's update before reassessing.");
      return;
    }
    setError(null);
    try {
      const result = await submitReply({
        task_id: task.task_id,
        new_status: status,
        revised_due_date: dueDate || null,
        progress: Number.isFinite(Number(progress)) ? Number(progress) : null,
        update: update.trim(),
        responded_at: new Date().toISOString(),
      });
      setEvent(result);
      setStep("result");
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Reassessment failed.");
    }
  };

  const copyQuestion = async () => {
    if (!question) return;
    try {
      await navigator.clipboard.writeText(question);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setError("Clipboard is unavailable in this browser.");
    }
  };

  const titles: Record<Step, string> = {
    ask: `Ask ${task.owner} about ${task.title}`,
    reply: `Record ${task.owner}'s update`,
    result: "Plan reassessed",
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={titles[step]}
      description={
        step === "result"
          ? "Reroute re-scored the release with this update applied."
          : `${task.task_id} · ${pluralize(task.downstream.length, "task")} downstream`
      }
      footer={
        step === "ask" ? (
          <>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setStep("reply")}>
              I have their reply
            </Button>
          </>
        ) : step === "reply" ? (
          <>
            <Button variant="ghost" onClick={question ? () => setStep("ask") : onClose}>
              {question ? "Back" : "Cancel"}
            </Button>
            <Button variant="primary" loading={isReassessing} onClick={submit}>
              Apply and reassess
            </Button>
          </>
        ) : (
          <Button variant="primary" onClick={onClose}>
            Done
          </Button>
        )
      }
    >
      {step === "ask" && question ? (
        <div className="flex flex-col gap-3">
          <p className="text-meta text-ink-muted">
            Reroute drafted the question that unblocks the most work. Send it as-is or edit it in your own
            channel.
          </p>
          <blockquote className="rounded-md border border-line bg-raised p-3 text-body leading-relaxed text-ink">
            {question}
          </blockquote>
          <div>
            <Button size="sm" icon={<CopyIcon width={12} height={12} />} onClick={copyQuestion}>
              {copied ? "Copied" : "Copy question"}
            </Button>
          </div>
        </div>
      ) : null}

      {step === "reply" ? (
        <div className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="New status">
              {(props) => (
                <Select {...props} value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}>
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {STATUS_LABEL[option]}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Revised due date" hint="Leave as-is if the date has not moved.">
              {(props) => (
                <TextInput
                  {...props}
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              )}
            </Field>
            <Field label="Progress %">
              {(props) => (
                <TextInput
                  {...props}
                  type="number"
                  min={0}
                  max={100}
                  value={progress}
                  onChange={(e) => setProgress(e.target.value)}
                />
              )}
            </Field>
          </div>
          <Field label="Owner's update" hint="This replaces the task's latest update in the workspace.">
            {(props) => (
              <TextArea
                {...props}
                rows={4}
                value={update}
                onChange={(e) => setUpdate(e.target.value)}
                placeholder={`e.g. Credentials arrived this morning, refund webhooks verified, shipping by Friday.`}
              />
            )}
          </Field>
          {error ? <p className="text-meta text-critical">{error}</p> : null}
        </div>
      ) : null}

      {step === "result" && event ? (
        <div className="flex flex-col gap-4">
          <RiskDelta event={event} />
          <div>
            <p className="text-micro font-semibold uppercase tracking-[0.08em] text-ink-faint">
              Update applied
            </p>
            <p className="mt-1.5 text-meta leading-relaxed text-ink-muted">{event.reply.update}</p>
          </div>
        </div>
      ) : null}
    </Dialog>
  );
}

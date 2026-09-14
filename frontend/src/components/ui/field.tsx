import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { useId } from "react";
import { cn } from "@/lib/cn";

const CONTROL =
  "w-full rounded-md border border-line-strong bg-raised px-2.5 py-1.5 text-body text-ink placeholder:text-ink-faint " +
  "transition-colors hover:border-ink-faint/50 focus:border-brand focus:outline-none disabled:opacity-45";

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: (props: { id: string; "aria-describedby"?: string }) => ReactNode;
  className?: string;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-meta font-medium text-ink-muted">
        {label}
      </label>
      {children({ id, "aria-describedby": hint ? hintId : undefined })}
      {hint ? (
        <p id={hintId} className="text-micro text-ink-faint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(CONTROL, className)} {...props} />;
}

export function TextArea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(CONTROL, "resize-y leading-relaxed", className)} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(CONTROL, "appearance-none pr-7 cursor-pointer", className)} {...props}>
      {children}
    </select>
  );
}

export function FilterSelect({
  label,
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return (
    <label className={cn("relative inline-flex items-center", className)}>
      <span className="sr-only">{label}</span>
      <select
        className="h-7 cursor-pointer appearance-none rounded-md border border-line-strong bg-raised pl-2.5 pr-6 text-meta text-ink-muted transition-colors hover:border-ink-faint/50 hover:text-ink focus:border-brand focus:outline-none"
        {...props}
      >
        {children}
      </select>
      <svg
        viewBox="0 0 16 16"
        className="pointer-events-none absolute right-1.5 h-3 w-3 text-ink-faint"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        aria-hidden="true"
      >
        <path d="m4 6.5 4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </label>
  );
}

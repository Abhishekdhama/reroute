"use client";

import { useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Tooltip({
  content,
  children,
  className,
}: {
  content: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <span
      className={cn("relative inline-flex", className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <span aria-describedby={open ? id : undefined} tabIndex={0} className="inline-flex rounded-sm">
        {children}
      </span>
      {open ? (
        <span
          role="tooltip"
          id={id}
          className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-1.5 w-max max-w-[220px] -translate-x-1/2 rounded-md border border-line-strong bg-overlay px-2 py-1.5 text-micro leading-snug text-ink shadow-lg shadow-black/40"
        >
          {content}
        </span>
      ) : null}
    </span>
  );
}

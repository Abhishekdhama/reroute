"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
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
  const rootRef = useRef<HTMLSpanElement>(null);

  // Hover/focus opens it on desktop. On touch, a tap fires focus before click,
  // so a click *toggle* would immediately re-close what focus just opened —
  // click only opens (idempotent); an outside tap is what closes it on touch.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <span
      ref={rootRef}
      className={cn("relative inline-flex", className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <button
        type="button"
        aria-describedby={open ? id : undefined}
        onClick={() => setOpen(true)}
        className="inline-flex rounded-sm text-inherit"
      >
        {children}
      </button>
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

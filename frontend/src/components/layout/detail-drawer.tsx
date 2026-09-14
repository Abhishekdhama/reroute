"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { IconButton } from "@/components/ui/button";
import { CloseIcon } from "@/components/ui/icons";

export function DetailDrawer({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-base/70" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-line bg-surface shadow-2xl shadow-black/50"
      >
        <header className="flex h-11 shrink-0 items-center justify-between border-b border-line px-3">
          <span className="text-meta font-semibold uppercase tracking-[0.07em] text-ink-muted">{title}</span>
          <IconButton label="Close details" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

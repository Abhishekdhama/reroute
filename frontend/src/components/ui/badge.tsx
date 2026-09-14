import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { TONE_SOFT, type Tone } from "@/lib/labels";

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded border px-1.5 py-px text-micro font-medium",
        TONE_SOFT[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

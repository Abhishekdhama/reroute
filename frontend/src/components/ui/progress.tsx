import { cn } from "@/lib/cn";
import { TONE_BG, type Tone } from "@/lib/labels";

export function ProgressBar({
  value,
  tone = "neutral",
  className,
  label,
}: {
  value: number;
  tone?: Tone;
  className?: string;
  label?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn("h-1 w-full overflow-hidden rounded-full bg-line", className)}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-300", TONE_BG[tone])}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

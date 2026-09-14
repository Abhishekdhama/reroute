import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";

export function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      title={name}
      className={cn(
        "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
        "border border-line-strong bg-raised text-[9px] font-semibold text-ink-muted",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}

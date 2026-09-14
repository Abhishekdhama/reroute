import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand text-base font-medium hover:bg-brand/90 border border-transparent",
  secondary: "bg-raised text-ink border border-line-strong hover:bg-overlay hover:border-ink-faint/50",
  ghost: "bg-transparent text-ink-muted border border-transparent hover:bg-raised hover:text-ink",
  danger: "bg-critical/10 text-critical border border-critical/30 hover:bg-critical/20",
};

const SIZES: Record<Size, string> = {
  sm: "h-7 px-2.5 text-meta gap-1.5",
  md: "h-8 px-3 text-body gap-2",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
}

export function Button({
  variant = "secondary",
  size = "md",
  loading = false,
  icon,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center rounded-md whitespace-nowrap transition-colors duration-100",
        "disabled:opacity-45 disabled:pointer-events-none",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {loading ? <Spinner /> : icon}
      {children}
    </button>
  );
}

export function IconButton({
  label,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-md border border-line-strong",
        "bg-raised text-ink-muted transition-colors hover:bg-overlay hover:text-ink",
        "disabled:opacity-45 disabled:pointer-events-none",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "h-3 w-3 shrink-0 animate-spin rounded-full border-[1.5px] border-current border-t-transparent",
        className,
      )}
    />
  );
}

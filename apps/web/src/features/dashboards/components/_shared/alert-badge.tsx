import { cn } from "@/lib/cn";
import type { Severity } from "./alert-card";

export interface AlertBadgeProps {
  count: number;
  /** Severity of the most critical alert in the group — drives the dot color. */
  severity: Severity;
  className?: string;
}

const DOT: Record<Severity, string> = {
  critical: "bg-err",
  warning: "bg-warn",
  info: "bg-ink/40",
};

/**
 * Inline badge for section titles, e.g. `Mi cartera  ●3 alertas`.
 * Renders nothing when `count` is 0 so callers can drop it in unconditionally.
 * See spec §2.2.
 */
export function AlertBadge({ count, severity, className }: AlertBadgeProps) {
  if (count <= 0) return null;
  const label = count === 1 ? "alerta" : "alertas";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[14px] font-semibold tracking-[0.04em] uppercase text-ink/60",
        className,
      )}
      aria-label={`${count} ${label}`}
    >
      <span aria-hidden className={cn("w-2 h-2 rounded-full", DOT[severity])} />
      {count} {label}
    </span>
  );
}

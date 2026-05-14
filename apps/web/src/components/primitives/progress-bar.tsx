import { cn } from "@/lib/cn";

export type ProgressTone = "neutral" | "ok" | "warn" | "danger";

export interface ProgressBarProps {
  /** 0..1 */
  value: number;
  tone?: ProgressTone;
  showLabel?: boolean;
  className?: string;
  ariaLabel?: string;
}

const FILL: Record<ProgressTone, string> = {
  neutral: "bg-ink",
  ok: "bg-ok",
  warn: "bg-warn",
  danger: "bg-err",
};

export function ProgressBar({
  value,
  tone = "neutral",
  showLabel = false,
  className,
  ariaLabel = "Progreso",
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(1, value));
  const pct = Math.round(clamped * 100);
  return (
    <div
      className={cn("relative h-1.5 w-full rounded-pill bg-ink/[0.08] overflow-hidden", className)}
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
    >
      <div
        className={cn("h-full rounded-[inherit] transition-[width] duration-200 ease-luxe", FILL[tone])}
        style={{ width: `${pct}%` }}
      />
      {showLabel ? (
        <span className="absolute right-0 -top-[18px] text-[15px] text-ink/60">{pct}%</span>
      ) : null}
    </div>
  );
}

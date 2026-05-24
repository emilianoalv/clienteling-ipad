import { cn } from "@/lib/cn";
import { formatPercent, formatPercentDelta } from "@/lib/format/number";

export interface ConversionBarProps {
  label: string;
  /** Current value, 0-100. */
  value: number;
  /** Counter / peer reference value, 0-100 — drawn as a vertical tick. */
  counterValue: number;
  className?: string;
}

/**
 * Horizontal bar comparing the BA's conversion rate with the peer counter
 * average. A vertical tick marks the counter value; the right column shows
 * the delta in pp.
 */
export function ConversionBar({
  label,
  value,
  counterValue,
  className,
}: ConversionBarProps) {
  const v = clamp(value);
  const c = clamp(counterValue);
  const delta = value - counterValue;
  const tone =
    delta > 0 ? "text-ok" : delta < 0 ? "text-err" : "text-ink/60";

  return (
    <div className={cn("grid grid-cols-[auto_1fr_auto] items-center gap-3", className)}>
      <span className="text-[16px] text-ink/80 min-w-[160px]">{label}</span>
      <div className="relative h-3 rounded-full bg-ink/[0.06] overflow-visible">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-ink"
          style={{ width: `${v}%` }}
          aria-hidden
        />
        <span
          aria-hidden
          className="absolute top-[-3px] bottom-[-3px] w-px bg-ink/40"
          style={{ left: `${c}%` }}
          title={`Counter ${formatPercent(counterValue)}`}
        />
      </div>
      <span className="text-[16px] font-semibold tabular flex items-baseline gap-2 min-w-[160px] justify-end">
        <span>{formatPercent(value)}</span>
        <span className={cn("text-[14px] font-medium", tone)}>
          vs counter {formatPercent(counterValue)} ({formatPercentDelta(delta)})
        </span>
      </span>
    </div>
  );
}

function clamp(n: number): number {
  if (Number.isNaN(n)) return 0;
  if (n < 0) return 0;
  if (n > 100) return 100;
  return n;
}

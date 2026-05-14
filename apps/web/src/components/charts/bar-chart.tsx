import { cn } from "@/lib/cn";

export interface BarChartProps {
  values: readonly number[];
  labels?: readonly string[];
  height?: number;
  /** Index to highlight in accent color (0-based, -1 = none). */
  highlight?: number;
  className?: string;
}

/**
 * Vertical bar chart for compact category comparisons (e.g. weekday volume,
 * adoption ranking). All values share a single y-axis derived from the max.
 */
export function BarChart({
  values,
  labels,
  height = 88,
  highlight = -1,
  className,
}: BarChartProps) {
  if (values.length === 0) return null;
  const max = Math.max(...values, 1);

  return (
    <div
      className={cn("flex items-end gap-1.5 py-1", className)}
      style={{ height }}
      role="img"
      aria-label={labels ? `${values.length} bars` : undefined}
    >
      {values.map((v, i) => {
        const pct = Math.max(0, Math.min(1, v / max));
        const isHi = i === highlight;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className={cn(
                "w-full rounded-sm transition-[height] duration-500 ease-luxe",
                isHi ? "bg-ink" : "bg-ink/40",
              )}
              style={{ height: `${pct * 100}%` }}
            />
            {labels ? (
              <span
                className={cn(
                  "text-[13px] leading-none",
                  isHi ? "font-semibold text-ink" : "text-ink/60",
                )}
              >
                {labels[i]}
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

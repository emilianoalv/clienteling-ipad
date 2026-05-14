import { cn } from "@/lib/cn";

export interface HeatmapCell {
  region: string;
  value: string;
  /** Intensity 0..1. Drives fill opacity and text color flip. */
  intensity: number;
}

export interface HeatmapProps {
  cells: readonly HeatmapCell[];
  columns?: number;
  className?: string;
}

/**
 * Simple grid heatmap for regional snapshots. Each cell shows region + value
 * with a saturation proportional to `intensity`.
 */
export function Heatmap({ cells, columns = 6, className }: HeatmapProps) {
  return (
    <div
      className={cn("grid gap-1.5", className)}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {cells.map((c, i) => {
        const a = Math.max(0, Math.min(1, c.intensity));
        const fg = a > 0.5 ? "text-paper" : "text-ink";
        const subFg = a > 0.5 ? "text-paper/80" : "text-ink/60";
        return (
          <div
            key={`${c.region}-${i}`}
            className={cn("px-2.5 py-2.5 rounded-md flex flex-col gap-0.5", fg)}
            style={{ background: `rgba(14, 14, 15, ${0.06 + a * 0.6})` }}
          >
            <div className={cn("text-[14px]", subFg)}>{c.region}</div>
            <div className="text-[17px] font-semibold tabular">{c.value}</div>
          </div>
        );
      })}
    </div>
  );
}

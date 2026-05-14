import { cn } from "@/lib/cn";

export interface LineChartProps {
  /** One or more series sharing the same x-axis. Each series has same length. */
  series: ReadonlyArray<readonly number[]>;
  labels: readonly string[];
  height?: number;
  /** CSS color per series (defaults rotate through ink/ok/lancome/ysl). */
  colors?: readonly string[];
  legend?: readonly string[];
  className?: string;
}

const DEFAULT_COLORS = [
  "var(--color-ink)",
  "var(--color-ok)",
  "var(--color-lancome-rose-deep)",
  "var(--color-ysl-gold)",
];

const VIEW_W = 560;

/**
 * Multi-series line chart with dashed grid lines and optional legend.
 * Pure SVG so it server-renders fine.
 */
export function LineChart({
  series,
  labels,
  height = 120,
  colors = DEFAULT_COLORS,
  legend,
  className,
}: LineChartProps) {
  if (series.length === 0 || series[0]!.length < 2) return null;
  const flat = series.flatMap((s) => s);
  const min = Math.min(...flat);
  const max = Math.max(...flat);
  const range = max - min || 1;
  const step = VIEW_W / (series[0]!.length - 1);
  const yFor = (v: number) => height - ((v - min) / range) * (height - 16) - 4;
  const grid = [0, 0.25, 0.5, 0.75, 1] as const;

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <svg
        viewBox={`0 0 ${VIEW_W} ${height}`}
        width="100%"
        height={height}
        className="overflow-visible"
        aria-hidden
      >
        {grid.map((g, i) => (
          <line
            key={i}
            x1="0"
            x2={VIEW_W}
            y1={yFor(min + range * g)}
            y2={yFor(min + range * g)}
            stroke="var(--color-line)"
            strokeDasharray="2 4"
          />
        ))}
        {series.map((s, si) => {
          const points = s.map((v, i) => `${i * step},${yFor(v)}`).join(" ");
          const color = colors[si] ?? DEFAULT_COLORS[si % DEFAULT_COLORS.length] ?? "currentColor";
          return (
            <g key={si}>
              <polyline
                fill="none"
                stroke={color}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
              />
              {s.map((v, i) => (
                <circle key={i} cx={i * step} cy={yFor(v)} r="2" fill={color} />
              ))}
            </g>
          );
        })}
      </svg>
      <div className="flex justify-between mt-1">
        {labels.map((l, i) => (
          <span key={i} className="text-[13px] text-ink/60">
            {l}
          </span>
        ))}
      </div>
      {legend ? (
        <div className="flex gap-3.5 mt-2">
          {legend.map((l, i) => (
            <span key={l} className="text-[15px] inline-flex items-center gap-1.5">
              <span
                className="inline-block w-2.5 h-0.5"
                style={{ background: colors[i] ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length] }}
              />
              {l}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

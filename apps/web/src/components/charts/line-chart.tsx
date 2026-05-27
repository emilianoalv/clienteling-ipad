import { cn } from "@/lib/cn";

export interface LineChartProps {
  /**
   * One or more series sharing the same x-axis. Each series has same length.
   * Optional when `values` is provided as a single-series shortcut.
   */
  series?: ReadonlyArray<readonly number[]>;
  /** Single-series shortcut. Mutually exclusive with `series`. */
  values?: readonly number[];
  /** X-axis labels — one per data point. */
  labels: readonly string[];
  height?: number;
  /** CSS color per series (defaults rotate through ink/ok/lancome/ysl). */
  colors?: readonly string[];
  legend?: readonly string[];
  /** Render X-axis labels below the chart. Default true. */
  showXAxis?: boolean;
  /**
   * Render Y-axis tick labels to the left of the chart (opt-in).
   * Reserves ~64px of horizontal padding for the labels. Default false to
   * keep existing call sites pixel-identical.
   */
  showYAxis?: boolean;
  /** Render dashed horizontal grid lines. Default true. */
  showGrid?: boolean;
  /** Transform x-axis labels just before render. */
  xAxisFormatter?: (label: string, index: number) => string;
  /** Format y-axis tick values (only used when `showYAxis` is true). */
  yAxisFormatter?: (value: number) => string;
  /**
   * Optional caption rendered below the x-axis labels, centred over the
   * plot area. Use for the month/range descriptor when the labels
   * themselves are bare day numbers (e.g. "Mayo 2026").
   */
  xAxisTitle?: string;
  className?: string;
}

const DEFAULT_COLORS = [
  "var(--color-ink)",
  "var(--color-ok)",
  "var(--color-lancome-rose-deep)",
  "var(--color-ysl-gold)",
];

const VIEW_W = 560;
const Y_AXIS_GUTTER = 56;

/**
 * Multi-series line chart with dashed grid lines and optional axes.
 * Pure SVG so it server-renders fine.
 *
 * Single-series callers can use the `values` shortcut instead of wrapping
 * in `[[...]]`. Y-axis labels are opt-in to preserve pixel-identical
 * behaviour for the legacy call sites.
 */
export function LineChart({
  series,
  values,
  labels,
  height = 120,
  colors = DEFAULT_COLORS,
  legend,
  showXAxis = true,
  showYAxis = false,
  showGrid = true,
  xAxisFormatter,
  yAxisFormatter,
  xAxisTitle,
  className,
}: LineChartProps) {
  const normalizedSeries: ReadonlyArray<readonly number[]> = values
    ? [values]
    : (series ?? []);
  if (normalizedSeries.length === 0 || normalizedSeries[0]!.length < 2) {
    return null;
  }

  const flat = normalizedSeries.flatMap((s) => s);
  const min = Math.min(...flat);
  const max = Math.max(...flat);
  const range = max - min || 1;

  const plotLeft = showYAxis ? Y_AXIS_GUTTER : 0;
  const plotWidth = VIEW_W - plotLeft;
  const step = plotWidth / (normalizedSeries[0]!.length - 1);
  const yFor = (v: number) => height - ((v - min) / range) * (height - 16) - 4;
  const grid = [0, 0.25, 0.5, 0.75, 1] as const;

  const fmtX = xAxisFormatter ?? ((l: string) => l);
  const fmtY = yAxisFormatter ?? ((v: number) => String(Math.round(v)));

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <svg
        viewBox={`0 0 ${VIEW_W} ${height}`}
        width="100%"
        height={height}
        className="overflow-visible"
        aria-hidden
      >
        {showGrid
          ? grid.map((g, i) => (
              <line
                key={`grid-${i}`}
                x1={plotLeft}
                x2={VIEW_W}
                y1={yFor(min + range * g)}
                y2={yFor(min + range * g)}
                stroke="var(--color-line)"
                strokeDasharray="2 4"
              />
            ))
          : null}
        {showYAxis
          ? grid.map((g, i) => {
              const v = min + range * g;
              return (
                <text
                  key={`y-${i}`}
                  x={plotLeft - 8}
                  y={yFor(v) + 4}
                  textAnchor="end"
                  className="fill-ink/60"
                  style={{ fontSize: 11 }}
                >
                  {fmtY(v)}
                </text>
              );
            })
          : null}
        {normalizedSeries.map((s, si) => {
          const points = s
            .map((v, i) => `${plotLeft + i * step},${yFor(v)}`)
            .join(" ");
          const color =
            colors[si] ?? DEFAULT_COLORS[si % DEFAULT_COLORS.length] ?? "currentColor";
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
                <circle
                  key={i}
                  cx={plotLeft + i * step}
                  cy={yFor(v)}
                  r="2"
                  fill={color}
                />
              ))}
            </g>
          );
        })}
      </svg>
      {showXAxis ? (
        <div
          className="flex justify-between mt-1"
          style={showYAxis ? { paddingLeft: `${(Y_AXIS_GUTTER / VIEW_W) * 100}%` } : undefined}
        >
          {labels.map((l, i) => {
            const text = fmtX(l, i);
            // Empty labels still need a placeholder span so flex
            // `justify-between` keeps column alignment with the data points.
            return (
              <span
                key={i}
                className="text-[13px] text-ink/60"
                aria-hidden={text === "" || undefined}
              >
                {text === "" ? " " : text}
              </span>
            );
          })}
        </div>
      ) : null}
      {xAxisTitle ? (
        <div
          className="text-center mt-1 text-[12px] text-ink/60"
          style={showYAxis ? { paddingLeft: `${(Y_AXIS_GUTTER / VIEW_W) * 100}%` } : undefined}
        >
          {xAxisTitle}
        </div>
      ) : null}
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

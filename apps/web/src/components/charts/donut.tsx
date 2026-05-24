import { cn } from "@/lib/cn";

export interface DonutSegment {
  label: string;
  value: number;
  /** Tailwind text-color or hex/CSS color for the SVG stroke. */
  color: string;
}

export interface DonutProps {
  segments: readonly DonutSegment[];
  centerLabel?: string;
  centerSub?: string;
  size?: number;
  className?: string;
}

/**
 * Lightweight SVG donut. Segments are rendered as stroked arcs on a single
 * circle using `stroke-dasharray` offsets — no external library, no client
 * code. Empty input falls back to a single muted ring so the layout slot
 * stays the same.
 */
export function Donut({
  segments,
  centerLabel,
  centerSub,
  size = 200,
  className,
}: DonutProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const radius = size / 2 - 12;
  const circumference = 2 * Math.PI * radius;
  const c = size / 2;

  let offset = 0;
  const arcs = segments.map((seg) => {
    const fraction = total === 0 ? 0 : seg.value / total;
    const length = fraction * circumference;
    const dashArray = `${length} ${circumference - length}`;
    const dashOffset = -offset;
    offset += length;
    return { ...seg, dashArray, dashOffset, fraction };
  });

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          role="img"
          aria-label={
            segments.length === 0
              ? "Sin datos"
              : segments.map((s) => `${s.label} ${Math.round((s.value / Math.max(total, 1)) * 100)}%`).join(", ")
          }
        >
          <circle
            cx={c}
            cy={c}
            r={radius}
            fill="none"
            stroke="currentColor"
            className="text-ink/[0.06]"
            strokeWidth={20}
          />
          {arcs.map((a, i) => (
            <circle
              key={i}
              cx={c}
              cy={c}
              r={radius}
              fill="none"
              stroke={a.color}
              strokeWidth={20}
              strokeDasharray={a.dashArray}
              strokeDashoffset={a.dashOffset}
              transform={`rotate(-90 ${c} ${c})`}
              strokeLinecap="butt"
            />
          ))}
        </svg>
        {centerLabel ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="font-display text-[28px] leading-none tabular">{centerLabel}</span>
            {centerSub ? (
              <span className="text-[14px] text-ink/60 mt-1">{centerSub}</span>
            ) : null}
          </div>
        ) : null}
      </div>
      <ul className="list-none m-0 p-0 grid grid-cols-1 gap-1 text-[15px] min-w-[160px]">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2">
            <span
              aria-hidden
              className="inline-block w-3 h-3 rounded-sm"
              style={{ backgroundColor: s.color }}
            />
            <span className="text-ink/70 flex-1">{s.label}</span>
            <span className="font-semibold tabular">
              {total === 0 ? "0%" : `${Math.round((s.value / total) * 100)}%`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

import { cn } from "@/lib/cn";

export interface ScatterPoint {
  label: string;
  /** Adoption % on the x-axis (0..100). */
  adoption: number;
  /** Sales on the y-axis (any positive scale). */
  sales: number;
}

export interface ScatterPlotProps {
  points: readonly ScatterPoint[];
  /** Sales value that splits "alta" vs "baja" on the y-axis (defaults 3.2M). */
  yMid?: number;
  /** Adoption % that splits "alta" vs "baja" on the x-axis (defaults 60). */
  xMid?: number;
  yMax?: number;
  height?: number;
  /** Labels for the 4 quadrants — top-left, top-right, bottom-left, bottom-right. */
  quadrantLabels?: {
    topLeft: string;
    topRight: string;
    bottomLeft: string;
    bottomRight: string;
  };
  axisLabels?: { x: string; y: string };
  className?: string;
}

const W = 520;

const DEFAULT_QUADS = {
  topLeft: "ALTAS VENTAS · BAJA ADOPCIÓN",
  topRight: "ESTRELLA",
  bottomLeft: "REZAGADA",
  bottomRight: "ALTA ADOPCIÓN · BAJAS VENTAS",
};

const DEFAULT_AXES = {
  x: "Adopción BA (%) →",
  y: "Ventas MTD →",
};

/**
 * Scatter plot with two quadrant divider lines and quadrant labels in the
 * corners. Points are color-coded ok/warn/err based on their quadrant.
 */
export function ScatterPlot({
  points,
  yMid = 3_200_000,
  xMid = 60,
  yMax = 5_000_000,
  height = 220,
  quadrantLabels = DEFAULT_QUADS,
  axisLabels = DEFAULT_AXES,
  className,
}: ScatterPlotProps) {
  const xFor = (x: number) => (x / 100) * W;
  const yFor = (y: number) => height - (y / yMax) * (height - 24) - 16;

  return (
    <svg
      viewBox={`0 0 ${W} ${height}`}
      width="100%"
      height={height}
      className={cn("block", className)}
      aria-hidden
    >
      <line
        x1={xFor(xMid)}
        x2={xFor(xMid)}
        y1={0}
        y2={height}
        stroke="var(--color-line)"
        strokeDasharray="3 3"
      />
      <line
        y1={yFor(yMid)}
        y2={yFor(yMid)}
        x1={0}
        x2={W}
        stroke="var(--color-line)"
        strokeDasharray="3 3"
      />

      <text x={10} y={14} fontSize="9" fill="var(--color-ink)" fillOpacity={0.6}>
        {quadrantLabels.topLeft}
      </text>
      <text x={W - 10} y={14} fontSize="9" fill="var(--color-ink)" fillOpacity={0.6} textAnchor="end">
        {quadrantLabels.topRight}
      </text>
      <text x={10} y={height - 6} fontSize="9" fill="var(--color-ink)" fillOpacity={0.6}>
        {quadrantLabels.bottomLeft}
      </text>
      <text x={W - 10} y={height - 6} fontSize="9" fill="var(--color-ink)" fillOpacity={0.6} textAnchor="end">
        {quadrantLabels.bottomRight}
      </text>

      {points.map((p, i) => {
        const tone =
          p.adoption >= xMid && p.sales >= yMid
            ? "var(--color-ok)"
            : p.adoption < xMid && p.sales < yMid
            ? "var(--color-err)"
            : "var(--color-warn)";
        return (
          <g key={`${p.label}-${i}`}>
            <circle cx={xFor(p.adoption)} cy={yFor(p.sales)} r={6} fill={tone} opacity="0.85" />
            <text x={xFor(p.adoption) + 9} y={yFor(p.sales) + 3} fontSize="10" fill="var(--color-ink)" fillOpacity={0.85}>
              {p.label}
            </text>
          </g>
        );
      })}

      <text x={W / 2} y={height} fontSize="9" fill="var(--color-ink)" fillOpacity={0.6} textAnchor="middle">
        {axisLabels.x}
      </text>
      <text
        x={2}
        y={height / 2}
        fontSize="9"
        fill="var(--color-ink)"
        fillOpacity={0.6}
        transform={`rotate(-90 8 ${height / 2})`}
      >
        {axisLabels.y}
      </text>
    </svg>
  );
}

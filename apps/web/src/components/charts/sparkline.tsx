import { cn } from "@/lib/cn";

export interface SparklineProps {
  values: readonly number[];
  width?: number;
  height?: number;
  className?: string;
  tone?: "ink" | "ok" | "err";
}

const TONE_STROKE: Record<NonNullable<SparklineProps["tone"]>, string> = {
  ink: "stroke-ink",
  ok: "stroke-ok",
  err: "stroke-err",
};

export function Sparkline({
  values,
  width = 100,
  height = 28,
  className,
  tone = "ink",
}: SparklineProps) {
  if (!values || values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = width / (values.length - 1);
  const points = values
    .map((v, i) => `${i * step},${height - ((v - min) / range) * height}`)
    .join(" ");
  const last = values[values.length - 1]!;

  return (
    <svg
      width={width}
      height={height}
      className={cn("block", className)}
      aria-hidden
    >
      <polyline
        fill="none"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
        className={TONE_STROKE[tone]}
      />
      <circle
        cx={(values.length - 1) * step}
        cy={height - ((last - min) / range) * height}
        r="2"
        className={TONE_STROKE[tone].replace("stroke-", "fill-")}
      />
    </svg>
  );
}

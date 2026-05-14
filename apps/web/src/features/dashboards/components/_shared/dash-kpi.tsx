import type { ReactNode } from "react";
import Link from "next/link";
import { Icon } from "@/components/primitives";
import { Sparkline } from "@/components/charts";
import { cn } from "@/lib/cn";

export type DashKpiTone = "neutral" | "ok" | "warn" | "err";

export interface DashKpiProps {
  label: string;
  value: ReactNode;
  /** Period-over-period delta as a percentage (e.g. 12 for +12%). */
  delta?: number;
  spark?: readonly number[];
  hint?: ReactNode;
  tone?: DashKpiTone;
  /** Make the whole tile a drilldown link. */
  drillHref?: string;
  /** Slightly taller variant for hero rows. */
  tall?: boolean;
}

const TONE_BG: Record<DashKpiTone, string> = {
  neutral: "bg-white",
  ok: "bg-ok/[0.08]",
  warn: "bg-warn/[0.08]",
  err: "bg-err/[0.08]",
};

const SPARK_TONE: Record<DashKpiTone, "ink" | "ok" | "err"> = {
  neutral: "ink",
  ok: "ok",
  warn: "ink",
  err: "err",
};

/**
 * Dashboard KPI tile (prototype `DKpi`). Hero tiles get `tall`, drillable tiles
 * pass a `drillHref` which wraps the tile in a Next Link. Delta and sparkline
 * are optional.
 */
export function DashKpi({
  label,
  value,
  delta,
  spark,
  hint,
  tone = "neutral",
  drillHref,
  tall = false,
}: DashKpiProps) {
  const inner = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
          {label}
        </span>
        {drillHref ? (
          <span className="text-ink/40">
            <Icon name="chevron-right" size={14} />
          </span>
        ) : null}
      </div>
      <div>
        <div
          className={cn(
            "font-display leading-[1.05] tracking-[-0.01em] tabular",
            tall ? "text-[36px]" : "text-[28px]",
          )}
        >
          {value}
        </div>
        <div className="flex items-center gap-2.5 mt-1 min-h-[18px]">
          {delta !== undefined ? (
            <span
              className={cn(
                "text-[15px] font-semibold",
                delta >= 0 ? "text-ok" : "text-err",
              )}
            >
              {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)}%
            </span>
          ) : null}
          {hint ? (
            <span className="text-[15px] font-medium text-ink/60 leading-snug">{hint}</span>
          ) : null}
          {spark ? (
            <span className="ml-auto">
              <Sparkline values={spark} width={72} height={22} tone={SPARK_TONE[tone]} />
            </span>
          ) : null}
        </div>
      </div>
    </>
  );

  const className = cn(
    "flex flex-col justify-between gap-2 rounded-lg border border-line p-4 text-left",
    tall ? "min-h-[128px]" : "min-h-[96px]",
    TONE_BG[tone],
    drillHref && "hover:border-ink/30 transition-colors cursor-pointer",
  );

  if (drillHref) {
    return (
      <Link href={drillHref} className={cn(className, "no-underline text-inherit")}>
        {inner}
      </Link>
    );
  }
  return <article className={className}>{inner}</article>;
}

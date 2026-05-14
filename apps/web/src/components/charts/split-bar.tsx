import { cn } from "@/lib/cn";

export interface SplitBarProps {
  a: number;
  b: number;
  aLabel: string;
  bLabel: string;
  /** Tailwind-class color for segment A (e.g. "bg-lancome-rose-deep"). */
  aClassName?: string;
  bClassName?: string;
  className?: string;
}

/**
 * Two-segment stacked horizontal bar with percentage labels underneath.
 * Used for brand/chain split panels on Manager and HQ dashboards.
 */
export function SplitBar({
  a,
  b,
  aLabel,
  bLabel,
  aClassName = "bg-ink",
  bClassName = "bg-ysl-gold",
  className,
}: SplitBarProps) {
  const total = Math.max(1, a + b);
  const aPct = Math.round((a / total) * 100);
  const bPct = 100 - aPct;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex h-2.5 rounded-pill overflow-hidden bg-ink/[0.08]">
        <div className={cn("h-full", aClassName)} style={{ width: `${aPct}%` }} />
        <div className={cn("h-full", bClassName)} style={{ width: `${bPct}%` }} />
      </div>
      <div className="flex justify-between text-[15px]">
        <span className="inline-flex items-center gap-1.5">
          <span className={cn("inline-block w-2 h-2 rounded-sm", aClassName)} />
          {aLabel} · <b className="tabular">{aPct}%</b>
        </span>
        <span className="inline-flex items-center gap-1.5">
          {bLabel} · <b className="tabular">{bPct}%</b>
          <span className={cn("inline-block w-2 h-2 rounded-sm", bClassName)} />
        </span>
      </div>
    </div>
  );
}

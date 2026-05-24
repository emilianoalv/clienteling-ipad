import { Icon } from "@/components/primitives";
import { cn } from "@/lib/cn";
import { formatCount, formatPercent } from "@/lib/format/number";

export interface FunnelStage {
  label: string;
  count: number;
  /** Sublabel shown below the stage name (optional). */
  hint?: string;
}

export interface FunnelProps {
  stages: readonly FunnelStage[];
  /** Show inter-stage conversion percentages. Default true. */
  showConversion?: boolean;
  className?: string;
}

/**
 * Multi-stage conversion funnel. Each stage's bar width is proportional to
 * its count against the largest stage (typically the first). Between stages
 * we render an arrow + `count[i+1] / count[i]` as a conversion percentage.
 */
export function Funnel({
  stages,
  showConversion = true,
  className,
}: FunnelProps) {
  if (stages.length === 0) return null;
  const max = Math.max(1, ...stages.map((s) => s.count));

  return (
    <ol className={cn("list-none m-0 p-0 flex flex-col gap-2", className)}>
      {stages.map((stage, i) => {
        const ratio = stage.count / max;
        const previous = i > 0 ? stages[i - 1] : null;
        const conv =
          showConversion && previous && previous.count > 0
            ? (stage.count / previous.count) * 100
            : null;
        return (
          <li key={stage.label} className="flex flex-col gap-1">
            {conv !== null ? (
              <div className="flex items-center gap-2 text-[14px] text-ink/60 pl-1">
                <Icon name="arrow-right" size={12} className="rotate-90" />
                <span>{formatPercent(conv)} pasan a la siguiente etapa</span>
              </div>
            ) : null}
            <div className="grid grid-cols-[1fr_auto] items-center gap-3">
              <div className="flex flex-col">
                <span className="text-[16px] font-medium leading-tight">
                  {stage.label}
                </span>
                {stage.hint ? (
                  <span className="text-[14px] text-ink/60 leading-tight">
                    {stage.hint}
                  </span>
                ) : null}
              </div>
              <span className="text-[16px] font-semibold tabular">
                {formatCount(stage.count)}
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-ink/[0.06] overflow-hidden">
              <div
                className="h-full bg-ink"
                style={{ width: `${Math.max(2, Math.round(ratio * 100))}%` }}
                aria-hidden
              />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

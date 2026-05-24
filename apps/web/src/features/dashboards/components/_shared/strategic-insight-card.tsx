import { Icon } from "@/components/primitives";
import { cn } from "@/lib/cn";
import type { IconName } from "@/types/icon";
import type { StrategicInsight } from "../../lib/strategic-insights";

export interface StrategicInsightCardProps {
  insight: StrategicInsight;
  className?: string;
}

const ICON_MAP: Record<StrategicInsight["icon"], IconName> = {
  "trending-up": "chart",
  target: "sparkle",
  compass: "shield",
};

/**
 * National-level "insight card" rendered in the Admin Strategic section.
 * Always uses the neutral/info tone (boardroom observation, not alert).
 */
export function StrategicInsightCard({
  insight,
  className,
}: StrategicInsightCardProps) {
  return (
    <article
      className={cn(
        "grid grid-cols-[auto_1fr] gap-3 items-start pl-3 pr-4 py-3 rounded-md border border-line border-l-4 border-l-ink/40 bg-ink/[0.03]",
        className,
      )}
    >
      <span aria-hidden className="inline-flex items-center text-ink/70 mt-0.5">
        <Icon name={ICON_MAP[insight.icon]} size={20} />
      </span>
      <div>
        <p className="m-0 text-[16px] font-semibold leading-tight text-ink">
          {insight.title}
        </p>
        <p className="m-0 mt-0.5 text-[15px] leading-snug text-ink/60">
          {insight.description}
        </p>
      </div>
    </article>
  );
}

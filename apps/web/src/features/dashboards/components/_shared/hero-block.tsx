import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface HeroBlockProps {
  /** Big primary card — left/top, 60% width on desktop. */
  main: ReactNode;
  /** Exactly three smaller cards stacked vertically on the right. */
  side: readonly [ReactNode, ReactNode, ReactNode];
  className?: string;
}

/**
 * Hero layout shared across the 4 dashboards: 1 big + 3 small cards.
 * Desktop: 60/40 split with the three side cards stacked vertically.
 * Mobile/iPad portrait: single column with main on top, sides below.
 */
export function HeroBlock({ main, side, className }: HeroBlockProps) {
  return (
    <section
      aria-label="Hero del dashboard"
      className={cn(
        "grid gap-3 grid-cols-1 md:grid-cols-[3fr_2fr]",
        className,
      )}
    >
      <div className="min-w-0">{main}</div>
      <div className="grid grid-cols-1 gap-3 min-w-0">
        {side[0]}
        {side[1]}
        {side[2]}
      </div>
    </section>
  );
}

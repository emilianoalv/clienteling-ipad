import { Children, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface StatStripProps {
  children: ReactNode;
  className?: string;
}

/**
 * Horizontal strip that wraps a row of <KpiCard> with a consistent gap.
 * Use for headers of history screens and dashboards.
 */
export function StatStrip({ children, className }: StatStripProps) {
  const count = Children.count(children);
  return (
    <div
      role="group"
      className={cn("grid gap-3", className)}
      style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
    >
      {children}
    </div>
  );
}

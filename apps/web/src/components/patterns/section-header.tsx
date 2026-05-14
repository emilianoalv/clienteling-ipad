import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface SectionHeaderProps {
  title: string;
  eyebrow?: string;
  right?: ReactNode;
  className?: string;
}

export function SectionHeader({ title, eyebrow, right, className }: SectionHeaderProps) {
  return (
    <header
      className={cn(
        "flex items-end justify-between gap-3 pb-3 mb-4 border-b border-line",
        className,
      )}
    >
      <div>
        {eyebrow ? (
          <span className="block mb-1.5 text-[15px] font-semibold tracking-[0.12em] uppercase text-ink/60">
            {eyebrow}
          </span>
        ) : null}
        <h2 className="m-0 font-display text-[22px] leading-tight tracking-[-0.01em] text-ink">
          {title}
        </h2>
      </div>
      {right ? <div className="inline-flex items-center gap-2">{right}</div> : null}
    </header>
  );
}

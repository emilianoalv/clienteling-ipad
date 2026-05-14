import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface DashBlockProps {
  /** Tiny eyebrow above the title. */
  eyebrow?: string;
  /** Display-font block title. */
  title?: string;
  /** Right-aligned slot (CTA button, action). */
  right?: ReactNode;
  /** Subtle right-aligned caption when no actions are needed. */
  caption?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Section wrapper with a labelled header and underline (prototype `DBlock`).
 * Used to chunk the dashboard into Performance / Equipo / Operación blocks.
 */
export function DashBlock({ eyebrow, title, right, caption, children, className }: DashBlockProps) {
  return (
    <section className={cn("mb-6", className)}>
      <header className="flex items-baseline justify-between gap-3 px-1 pb-2.5 mb-4 border-b border-line">
        <div>
          {eyebrow ? (
            <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
              {eyebrow}
            </div>
          ) : null}
          {title ? (
            <h2 className="m-0 font-display text-[22px] leading-tight tracking-[-0.01em]">
              {title}
            </h2>
          ) : null}
        </div>
        {right ?? (caption ? <span className="text-[15px] text-ink/60">{caption}</span> : null)}
      </header>
      {children}
    </section>
  );
}

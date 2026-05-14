import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface TopBarProps {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  className?: string;
}

export function TopBar({ title, subtitle, right, className }: TopBarProps) {
  return (
    <header
      className={cn(
        "h-[92px] px-10 bg-white border-b border-line flex items-center justify-between gap-4",
        className,
      )}
    >
      <div className="flex flex-col gap-1 min-w-0">
        <h1 className="m-0 text-xl font-semibold leading-tight tracking-[-0.005em] text-ink">
          {title}
        </h1>
        {subtitle ? (
          <p className="m-0 text-sm font-medium leading-normal text-ink/60">{subtitle}</p>
        ) : null}
      </div>
      {right ? <div className="inline-flex items-center gap-3">{right}</div> : null}
    </header>
  );
}

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type AlertTone = "neutral" | "ok" | "warn" | "danger";

export interface AlertRowProps {
  tone: AlertTone;
  title: string;
  description?: string;
  meta?: string;
  action?: ReactNode;
  className?: string;
}

const DOT: Record<AlertTone, string> = {
  neutral: "bg-ink/40",
  ok: "bg-ok",
  warn: "bg-warn",
  danger: "bg-err",
};

export function AlertRow({ tone, title, description, meta, action, className }: AlertRowProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-[8px_1fr_auto_auto] gap-3 items-center px-4 py-3 rounded-md border border-line bg-white",
        className,
      )}
    >
      <span aria-hidden className={cn("w-2 h-2 rounded-full", DOT[tone])} />
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-[16px] font-semibold leading-tight text-ink">{title}</span>
        {description ? (
          <span className="text-xs font-medium leading-snug text-ink/60">{description}</span>
        ) : null}
      </div>
      {meta ? <span className="text-xs font-medium leading-none text-ink/60 tabular">{meta}</span> : null}
      {action ? <div className="ml-2">{action}</div> : null}
    </div>
  );
}

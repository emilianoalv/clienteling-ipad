import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type KpiTone = "neutral" | "ok" | "warn" | "danger";
export type KpiSize = "sm" | "md" | "lg";

export interface KpiCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  delta?: { value: number; suffix?: string };
  tone?: KpiTone;
  size?: KpiSize;
  className?: string;
}

const TONE: Record<KpiTone, string> = {
  neutral: "bg-white border-line",
  ok: "bg-ok/[0.08] border-ok/20",
  warn: "bg-warn/[0.10] border-warn/20",
  danger: "bg-err/[0.08] border-err/20",
};

const SIZE: Record<KpiSize, { card: string; value: string }> = {
  sm: { card: "p-3 gap-1", value: "text-2xl" },
  md: { card: "p-4 gap-1.5", value: "text-[32px]" },
  lg: { card: "p-6 gap-2", value: "text-[56px]" },
};

export function KpiCard({
  label,
  value,
  hint,
  delta,
  tone = "neutral",
  size = "md",
  className,
}: KpiCardProps) {
  const direction = delta ? (delta.value > 0 ? "up" : delta.value < 0 ? "down" : "flat") : null;
  return (
    <article
      className={cn(
        "flex flex-col rounded-lg border shadow-lift",
        TONE[tone],
        SIZE[size].card,
        className,
      )}
    >
      <span className="text-[14.5px] font-semibold leading-tight tracking-[0.12em] uppercase text-ink/60">
        {label}
      </span>
      <div
        className={cn(
          "font-display leading-none tracking-[-0.01em] text-ink tabular",
          SIZE[size].value,
        )}
      >
        {value}
      </div>
      {delta ? (
        <span
          className={cn(
            "text-xs font-semibold leading-none",
            direction === "up" && "text-ok",
            direction === "down" && "text-err",
            direction === "flat" && "text-ink/60",
          )}
        >
          {delta.value > 0 ? "▲" : delta.value < 0 ? "▼" : "·"} {Math.abs(delta.value)}
          {delta.suffix ?? "%"}
        </span>
      ) : null}
      {hint ? <span className="text-xs font-medium leading-snug text-ink/60">{hint}</span> : null}
    </article>
  );
}

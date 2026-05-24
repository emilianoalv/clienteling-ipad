"use client";

import { useState } from "react";
import { Icon } from "@/components/primitives";
import { cn } from "@/lib/cn";
import { AlertCard, type AlertAction, type Severity } from "./alert-card";

export interface AlertBannerItem {
  severity: Severity;
  title: string;
  description?: string;
  action?: AlertAction;
}

export interface AlertBannerProps {
  alerts: ReadonlyArray<AlertBannerItem>;
  initialExpanded?: boolean;
  className?: string;
}

const SEVERITY_DOT: Record<Severity, string> = {
  critical: "bg-err",
  warning: "bg-warn",
  info: "bg-ink/40",
};

/**
 * Sticky collapsible banner for top-of-dashboard alerts. Collapsed shows a
 * one-line count summary; expanded renders an `<AlertCard>` per entry.
 * Hidden entirely when there are no alerts. See spec §2.2.
 */
export function AlertBanner({
  alerts,
  initialExpanded = false,
  className,
}: AlertBannerProps) {
  const [expanded, setExpanded] = useState(initialExpanded);

  if (alerts.length === 0) return null;

  const counts = countBySeverity(alerts);

  return (
    <section
      aria-label="Resumen de alertas"
      className={cn(
        "sticky top-0 z-30 bg-paper border-b border-line",
        className,
      )}
    >
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls="alert-banner-list"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-7 py-3 cursor-pointer hover:bg-bone"
      >
        <span className="flex items-center gap-4 text-[16px]">
          {counts.critical > 0 ? (
            <CountChip severity="critical" count={counts.critical} label="críticas" />
          ) : null}
          {counts.warning > 0 ? (
            <CountChip severity="warning" count={counts.warning} label="warnings" />
          ) : null}
          {counts.info > 0 ? (
            <CountChip severity="info" count={counts.info} label="info" />
          ) : null}
        </span>
        <span className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-ink">
          {expanded ? "Cerrar" : "Ver todo"}
          <Icon name={expanded ? "chevron-down" : "chevron-right"} size={14} />
        </span>
      </button>
      {expanded ? (
        <ul
          id="alert-banner-list"
          className="list-none m-0 p-0 px-7 pb-3 grid gap-2"
        >
          {alerts.map((a, i) => (
            <li key={i}>
              <AlertCard
                severity={a.severity}
                title={a.title}
                description={a.description}
                action={a.action}
              />
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function CountChip({
  severity,
  count,
  label,
}: {
  severity: Severity;
  count: number;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        aria-hidden
        className={cn("w-2 h-2 rounded-full", SEVERITY_DOT[severity])}
      />
      <span className="tabular font-semibold">{count}</span>
      <span className="text-ink/60">{label}</span>
    </span>
  );
}

function countBySeverity(
  alerts: ReadonlyArray<AlertBannerItem>,
): Record<Severity, number> {
  const out: Record<Severity, number> = { critical: 0, warning: 0, info: 0 };
  for (const a of alerts) out[a.severity] += 1;
  return out;
}

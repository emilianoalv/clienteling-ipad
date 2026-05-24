import Link from "next/link";
import { Icon } from "@/components/primitives";
import type { IconName } from "@/types/icon";
import { cn } from "@/lib/cn";

export type Severity = "critical" | "warning" | "info";

export interface AlertAction {
  label: string;
  href: string;
}

export interface AlertCardProps {
  severity: Severity;
  title: string;
  description?: string;
  action?: AlertAction;
  className?: string;
}

const STYLES: Record<
  Severity,
  { border: string; bg: string; text: string; icon: IconName; ariaTone: string }
> = {
  critical: {
    border: "border-l-err",
    bg: "bg-err/[0.04]",
    text: "text-err",
    icon: "warning",
    ariaTone: "Crítica",
  },
  warning: {
    border: "border-l-warn",
    bg: "bg-warn/[0.06]",
    text: "text-warn",
    icon: "warning",
    ariaTone: "Advertencia",
  },
  info: {
    border: "border-l-ink/40",
    bg: "bg-ink/[0.03]",
    text: "text-ink/60",
    icon: "bell",
    ariaTone: "Informativa",
  },
};

/**
 * Severity-bordered alert primitive. Server-compatible (no client hooks).
 * Layout: 4px left border in severity color · icon · title/description ·
 * optional action link. See spec §2.2.
 */
export function AlertCard({
  severity,
  title,
  description,
  action,
  className,
}: AlertCardProps) {
  const s = STYLES[severity];
  return (
    <article
      role="alert"
      className={cn(
        "grid grid-cols-[auto_1fr_auto] gap-3 items-center pl-3 pr-4 py-3 rounded-md border border-line border-l-4 bg-white",
        s.border,
        s.bg,
        className,
      )}
    >
      <span aria-hidden className={cn("inline-flex items-center", s.text)}>
        <Icon name={s.icon} size={18} />
      </span>
      <div className="min-w-0">
        <p className="m-0 text-[16px] font-semibold leading-tight text-ink">
          <span className="sr-only">{s.ariaTone}: </span>
          {title}
        </p>
        {description ? (
          <p className="m-0 mt-0.5 text-[15px] leading-snug text-ink/60">
            {description}
          </p>
        ) : null}
      </div>
      {action ? (
        <Link
          href={action.href}
          className="text-[15px] font-semibold text-ink hover:underline whitespace-nowrap"
        >
          {action.label} →
        </Link>
      ) : null}
    </article>
  );
}

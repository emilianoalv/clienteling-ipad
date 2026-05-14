import type { ReactNode } from "react";
import { Icon, type IconProps } from "@/components/primitives";
import type { IconName } from "@/types/icon";

export interface DashScope {
  label: string;
  value: string;
  icon?: IconName;
}

export interface DashHeaderProps {
  /** Tiny eyebrow above the page title (role · BA · store). */
  subtitle: string;
  /** Display-font page title. */
  title: string;
  /** Filter chip-like scopes shown under the title. */
  scopes?: readonly DashScope[];
  /** Right-aligned action buttons. */
  actions?: ReactNode;
}

/**
 * Page header for the 4 role dashboards (prototype `DHeader`).
 * Hard-coded scopes are illustrative pills — there's no state behind them yet,
 * they show the user what filters the dashboard applies.
 */
export function DashHeader({ subtitle, title, scopes, actions }: DashHeaderProps) {
  return (
    <header className="px-7 pt-6 pb-4 border-b border-line bg-paper">
      <div className="flex items-end justify-between gap-5 flex-wrap">
        <div>
          <span className="block text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
            {subtitle}
          </span>
          <h1 className="m-0 mt-1 font-display text-[38px] leading-none tracking-[-0.02em] font-normal">
            {title}
          </h1>
        </div>
        {actions ? <div className="flex gap-2 flex-wrap">{actions}</div> : null}
      </div>
      {scopes && scopes.length > 0 ? (
        <div className="flex gap-2 mt-3.5 flex-wrap">
          {scopes.map((s) => (
            <ScopePill key={s.label} {...s} />
          ))}
        </div>
      ) : null}
    </header>
  );
}

function ScopePill({ label, value, icon }: DashScope) {
  const iconSize: IconProps["size"] = 12;
  return (
    <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-pill border border-line bg-white text-[16px]">
      {icon ? <Icon name={icon} size={iconSize} /> : null}
      <span className="text-ink/60">{label}</span>
      <span className="font-semibold">{value}</span>
      <Icon name="chevron-down" size={12} />
    </span>
  );
}

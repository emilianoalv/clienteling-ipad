"use client";

import { cn } from "@/lib/cn";

export interface ToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  ariaLabel: string;
  disabled?: boolean;
}

/**
 * Pill-shaped on/off switch. Mirrors prototype consent toggles
 * (screens-clients.jsx:542-549). 48×28 px to match thumb-friendly iPad use.
 */
export function Toggle({ checked, onChange, ariaLabel, disabled }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-7 w-12 cursor-pointer items-center rounded-full border-0 p-0 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
        checked ? "bg-ink" : "bg-ink/[0.12]",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute top-0.5 inline-block h-[22px] w-[22px] rounded-full bg-white shadow-sm transition-[left] duration-200",
          checked ? "left-[22px]" : "left-0.5",
        )}
      />
    </button>
  );
}

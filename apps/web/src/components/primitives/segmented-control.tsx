"use client";

import { cn } from "@/lib/cn";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

export interface SegmentedControlProps<T extends string> {
  options: ReadonlyArray<SegmentedOption<T>>;
  value: T;
  onChange: (next: T) => void;
  ariaLabel: string;
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex gap-0.5 rounded-[10px] border border-line bg-bone p-1",
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "inline-flex h-7 items-center gap-1.5 rounded-lg px-3 font-sans text-[16px] font-medium leading-none transition-[background-color,color] duration-100 ease-luxe cursor-pointer",
              active
                ? "bg-white text-ink shadow-lift"
                : "bg-transparent text-ink/60 hover:text-ink",
            )}
          >
            <span>{opt.label}</span>
            {opt.count !== undefined ? (
              <span className="text-[15px] text-ink/40 tabular">{opt.count}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

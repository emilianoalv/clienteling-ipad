"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/primitives";
import { cn } from "@/lib/cn";

export type PeriodOption = "mtd" | "last-month" | "qtd" | "ytd" | "custom";

export interface PeriodPickerProps {
  value: PeriodOption;
  onChange: (value: PeriodOption) => void;
  className?: string;
}

const OPTIONS: ReadonlyArray<{
  value: PeriodOption;
  label: string;
  disabled?: boolean;
  disabledHint?: string;
}> = [
  { value: "mtd", label: "Mes en curso" },
  { value: "last-month", label: "Último mes" },
  { value: "qtd", label: "Trimestre" },
  { value: "ytd", label: "Año en curso" },
  // TODO(polish-day): build a real date-range picker for "custom". For Día 3
  // V1 the option is shown disabled with a tooltip so callers/tests still see
  // the slot in the API.
  { value: "custom", label: "Rango personalizado", disabled: true, disabledHint: "Próximamente" },
];

export function PeriodPicker({ value, onChange, className }: PeriodPickerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const currentLabel = OPTIONS.find((o) => o.value === value)?.label ?? "Mes en curso";

  return (
    <div ref={rootRef} className={cn("relative inline-block", className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Seleccionar período"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-pill border border-line bg-white text-[16px] hover:bg-bone cursor-pointer"
      >
        <Icon name="calendar" size={12} />
        <span className="text-ink/60">Período</span>
        <span className="font-semibold">{currentLabel}</span>
        <Icon name="chevron-down" size={12} />
      </button>
      {open ? (
        <ul
          role="listbox"
          aria-label="Opciones de período"
          className="absolute right-0 z-20 mt-1 list-none m-0 p-1 bg-white border border-line rounded-md shadow-lift min-w-[200px]"
        >
          {OPTIONS.map((opt) => {
            const active = opt.value === value;
            return (
              <li key={opt.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  disabled={opt.disabled}
                  title={opt.disabledHint}
                  onClick={() => {
                    if (opt.disabled) return;
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full text-left text-[16px] px-3 py-2 rounded-sm cursor-pointer",
                    active ? "bg-ink/[0.06] font-semibold" : "hover:bg-bone",
                    opt.disabled && "opacity-50 cursor-not-allowed",
                  )}
                >
                  {opt.label}
                  {opt.disabled ? (
                    <span className="ml-2 text-[14px] text-ink/40">({opt.disabledHint})</span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

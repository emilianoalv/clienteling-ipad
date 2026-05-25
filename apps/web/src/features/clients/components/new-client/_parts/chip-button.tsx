"use client";

import { cn } from "@/lib/cn";

export interface ChipButtonProps {
  active: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  size?: "sm" | "md";
  className?: string;
  /**
   * Vuelve el chip de solo lectura. Útil para campos auto-calculados
   * (ej. rango de edad derivado de la fecha de nacimiento) — el usuario
   * ve el valor pero no puede cambiarlo.
   */
  disabled?: boolean;
}

/**
 * Reusable single-toggle chip used inside grouped option cards
 * (interests, routine timing/level, skin type, age range, gender).
 * Mirrors prototype `lx-chip` button style.
 */
export function ChipButton({
  active,
  onClick,
  children,
  size = "md",
  className,
  disabled,
}: ChipButtonProps) {
  const heightClass = size === "sm" ? "h-7 px-2.5 text-[15.5px]" : "h-8 px-3 text-[16.5px]";
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      aria-pressed={active}
      disabled={disabled}
      className={cn(
        "inline-flex items-center rounded-full border font-medium leading-none transition-colors duration-100",
        heightClass,
        disabled
          ? active
            ? "bg-ink/80 border-ink/80 text-white cursor-default"
            : "bg-white border-line/60 text-ink/35 cursor-default"
          : active
            ? "bg-ink border-ink text-white cursor-pointer"
            : "bg-white border-line text-ink hover:bg-bone cursor-pointer",
        className,
      )}
    >
      {children}
    </button>
  );
}

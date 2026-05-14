"use client";

import { cn } from "@/lib/cn";

export interface ChipButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Reusable single-toggle chip used inside grouped option cards
 * (interests, routine timing/level, skin type, age range, gender).
 * Mirrors prototype `lx-chip` button style.
 */
export function ChipButton({ active, onClick, children, size = "md", className }: ChipButtonProps) {
  const heightClass = size === "sm" ? "h-7 px-2.5 text-[15.5px]" : "h-8 px-3 text-[16.5px]";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center rounded-full border font-medium leading-none transition-colors duration-100 cursor-pointer",
        heightClass,
        active
          ? "bg-ink border-ink text-white"
          : "bg-white border-line text-ink hover:bg-bone",
        className,
      )}
    >
      {children}
    </button>
  );
}

"use client";

import type { FollowupCategory } from "@/types/followup-task";
import { FOLLOWUP_CATEGORIES } from "@/types/followup-task";

/**
 * Mapeo categoría → variante visual. Las categorías de cierre temporal
 * (3 meses / 6 meses) usan accent neutro, eventos personales (cumple)
 * en cálido, comerciales (reposición / evento) en accent, ciclo de
 * muestra en ok suave. Mantiene legibilidad sin saturar la UI.
 */
const CATEGORY_VARIANT: Record<FollowupCategory, string> = {
  "sample-feedback": "bg-ok/10 text-ok border-ok/20",
  "post-purchase": "bg-ok/8 text-ok border-ok/20",
  "3-month-check": "bg-ink/[0.06] text-ink/75 border-line",
  "6-month-check": "bg-ink/[0.06] text-ink/75 border-line",
  replenishment: "bg-warn/10 text-warn border-warn/25",
  birthday: "bg-warn/12 text-warn border-warn/30",
  "special-event": "bg-ink text-paper border-ink",
  general: "bg-bone text-ink/70 border-line",
};

const LABEL_BY_ID = new Map(FOLLOWUP_CATEGORIES.map((c) => [c.id, c.label]));

export interface CategoryChipProps {
  category: FollowupCategory;
  /** Versión compacta — h-5 / text-[11px]. Default es h-6 / text-[12px]. */
  size?: "sm" | "md";
  className?: string;
}

export function CategoryChip({ category, size = "md", className }: CategoryChipProps) {
  const label = LABEL_BY_ID.get(category) ?? category;
  const sizeClass = size === "sm" ? "h-5 px-2 text-[11.5px]" : "h-6 px-2.5 text-[12px]";
  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold whitespace-nowrap ${sizeClass} ${CATEGORY_VARIANT[category]} ${className ?? ""}`}
    >
      {label}
    </span>
  );
}

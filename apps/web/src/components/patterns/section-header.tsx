import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface SectionHeaderProps {
  title: string;
  eyebrow?: string;
  right?: ReactNode;
  className?: string;
  /**
   * "page" (default) — header de la pantalla completa, título grande
   *   y prominente como ancla visual. Pensado para el top de cada ruta.
   * "inline" — más compacto, para usarse como label de sección dentro
   *   de Cards (formularios, side-panel cards).
   */
  size?: "page" | "inline";
}

/**
 * Page-section header. Auto-suprime el eyebrow cuando es igual al
 * título (case-insensitive, trim) — eso evita que las páginas que
 * pasan `eyebrow={t("rail.foo")}` + `title={t("foo.title")}` muestren
 * la misma palabra dos veces (ej. "COMPRAS / Compras"). Cuando el
 * eyebrow aporta scope distinto ("Mi tienda", "Configuración") se
 * conserva como contexto encima del título.
 */
export function SectionHeader({
  title,
  eyebrow,
  right,
  className,
  size = "page",
}: SectionHeaderProps) {
  const showEyebrow =
    eyebrow !== undefined &&
    eyebrow.trim().toLowerCase() !== title.trim().toLowerCase();

  const titleClass =
    size === "inline"
      ? "m-0 font-display text-[20px] leading-tight tracking-[-0.01em] text-ink"
      : "m-0 font-display text-[30px] leading-[1.1] tracking-[-0.015em] text-ink";

  const wrapperClass =
    size === "inline"
      ? "flex items-end justify-between gap-3 pb-2.5 mb-3 border-b border-line"
      : "flex items-end justify-between gap-3 pb-3 mb-4 border-b border-line";

  return (
    <header className={cn(wrapperClass, className)}>
      <div>
        {showEyebrow ? (
          <span className="block mb-1.5 text-[15px] font-semibold tracking-[0.12em] uppercase text-ink/60">
            {eyebrow}
          </span>
        ) : null}
        <h2 className={titleClass}>{title}</h2>
      </div>
      {right ? <div className="inline-flex items-center gap-2">{right}</div> : null}
    </header>
  );
}

/**
 * Date formatting helpers for dashboards (Etapa 2).
 *
 * Locale is `es-MX`. Variants follow the table in
 * `docs/dashboards-design-spec.md` §2.4:
 *   - Relative ("hoy", "ayer", "hace 3 días") for stat cards.
 *   - Short ("15 abr") for tables.
 *   - Long ("15 abr 2026") for detail panes.
 *   - Export ("2026-04-15", ISO) for CSV/Excel.
 *   - Smart: picks one of the above based on `now - date` distance.
 *
 * `formatRelative` from `format-date.ts` is the i18n RTF helper; this module
 * intentionally bypasses Intl for the relative variant to match the
 * Spanish-language strings called out in the spec ("hace 1 semana" instead
 * of "hace 7 días").
 */

import { daysBetween } from "@/lib/date/week";

const MX_LOCALE = "es-MX";

export function formatDateRelative(date: Date, now: Date = new Date()): string {
  const diff = daysBetween(now, date);
  if (diff === 0) return "hoy";
  if (diff === -1) return "ayer";
  if (diff === 1) return "mañana";
  const abs = Math.abs(diff);
  if (diff < 0) {
    if (abs < 7) return `hace ${abs} días`;
    if (abs < 30) {
      const weeks = Math.round(abs / 7);
      return weeks === 1 ? "hace 1 semana" : `hace ${weeks} semanas`;
    }
    const months = Math.round(abs / 30);
    return months === 1 ? "hace 1 mes" : `hace ${months} meses`;
  }
  if (abs < 7) return `en ${abs} días`;
  if (abs < 30) {
    const weeks = Math.round(abs / 7);
    return weeks === 1 ? "en 1 semana" : `en ${weeks} semanas`;
  }
  const months = Math.round(abs / 30);
  return months === 1 ? "en 1 mes" : `en ${months} meses`;
}

export function formatDateShort(date: Date): string {
  return new Intl.DateTimeFormat(MX_LOCALE, {
    day: "numeric",
    month: "short",
  }).format(date);
}

export function formatDateLong(date: Date): string {
  return new Intl.DateTimeFormat(MX_LOCALE, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateExport(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function smartFormatDate(date: Date, now: Date = new Date()): string {
  const abs = Math.abs(daysBetween(now, date));
  if (abs <= 30) return formatDateRelative(date, now);
  if (abs <= 90) return formatDateShort(date);
  return formatDateLong(date);
}

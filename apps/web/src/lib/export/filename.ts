import type { ExportFormat } from "./types";

export interface FilenameContext {
  role?: string;
  identifier?: string;
  period?: { from: Date; to: Date };
}

/**
 * Build a semantic, filesystem-safe export filename.
 *
 *   buildExportFilename(
 *     "reporte-clientes",
 *     { role: "BA", identifier: "Valentina Ríos", period: thisMonth() },
 *     "xlsx",
 *   ) // → "reporte-clientes-ba-valentina-rios-2026-05.xlsx"
 *
 * Lowercases, replaces non-ASCII letters/numbers with hyphens, collapses
 * repeats. The period is reduced to its starting `YYYY-MM` when the range
 * stays within one month, else `YYYY-MM-DD_YYYY-MM-DD`.
 */
export function buildExportFilename(
  base: string,
  context: FilenameContext,
  format: ExportFormat,
): string {
  const parts: string[] = [slug(base)];
  if (context.role) parts.push(slug(context.role));
  if (context.identifier) parts.push(slug(context.identifier));
  if (context.period) parts.push(periodSlug(context.period));
  return parts.filter((p) => p.length > 0).join("-") + "." + format;
}

function slug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function periodSlug(period: { from: Date; to: Date }): string {
  // Periods are half-open `[from, to)`. The last day actually included is
  // `to - 1 day`. Comparing against that lets MTD ranges like
  // `[1 May, 1 Jun)` collapse to `2026-05`.
  const lastIncluded = new Date(period.to.getTime() - 86_400_000);
  const sameMonth =
    period.from.getFullYear() === lastIncluded.getFullYear() &&
    period.from.getMonth() === lastIncluded.getMonth();
  if (sameMonth) {
    return `${period.from.getFullYear()}-${pad(period.from.getMonth() + 1)}`;
  }
  return `${ymd(period.from)}_${ymd(period.to)}`;
}

function ymd(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

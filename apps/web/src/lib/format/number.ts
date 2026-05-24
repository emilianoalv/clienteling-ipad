/**
 * Number formatting helpers for dashboards (Etapa 2).
 *
 * Variants are picked by display context (see dashboards-design-spec.md §2.4):
 * - Compact (`$1.2M`, `$486K`, `1.2K`) → stat cards / KPIs.
 * - Full (`$486,200`, `$486,200.00 MXN`) → tables, exports, detail.
 * - Percent variants split by semantic: `formatPercentDelta` is for deltas
 *   of percentages (pp), `formatPercentChange` for relative changes (%).
 *
 * Locale is `es-MX` (Mexican peso). On-screen we omit the "MXN" suffix
 * because context is implicit; exports include it for downstream tooling.
 */

const MX_LOCALE = "es-MX";

export function formatCurrencyCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${value.toLocaleString(MX_LOCALE)}`;
}

export function formatCurrencyFull(value: number): string {
  return new Intl.NumberFormat(MX_LOCALE, {
    style: "currency",
    currency: "MXN",
  }).format(value);
}

export function formatPercent(value: number, decimals = 0): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatPercentDelta(value: number): string {
  // Round half away from zero so -4.5 → -5pp (JS default rounds toward +∞).
  const rounded = Math.sign(value) * Math.round(Math.abs(value));
  const sign = rounded > 0 ? "+" : "";
  return `${sign}${rounded}pp`;
}

export function formatPercentChange(value: number, decimals = 1): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}

export function formatCountCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return `${value}`;
}

export function formatCount(value: number): string {
  return value.toLocaleString(MX_LOCALE);
}

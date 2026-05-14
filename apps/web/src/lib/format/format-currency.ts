/**
 * Currency formatting helpers.
 *
 * Prefer `useFormatter().number(...)` from next-intl inside components — it
 * binds to the active locale automatically. These stand-alone helpers are for
 * server-only code, tests and one-off scripts where the locale is explicit.
 */

import type { Locale } from "@/config/i18n";

export function formatCurrency(
  amount: number,
  locale: Locale = "es-MX",
  currency = "MXN",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCurrencyWithCents(
  amount: number,
  locale: Locale = "es-MX",
  currency = "MXN",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

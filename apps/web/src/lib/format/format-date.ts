import type { Locale } from "@/config/i18n";

export function formatDate(iso: string, locale: Locale = "es-MX"): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(new Date(iso));
}

export function formatTime(iso: string, locale: Locale = "es-MX"): string {
  return new Intl.DateTimeFormat(locale, { timeStyle: "short" }).format(new Date(iso));
}

export function formatRelative(iso: string, now: Date = new Date(), locale: Locale = "es-MX"): string {
  const diffMs = new Date(iso).getTime() - now.getTime();
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  const day = 86_400_000;
  if (Math.abs(diffMs) >= day) return rtf.format(Math.round(diffMs / day), "day");

  const hour = 3_600_000;
  if (Math.abs(diffMs) >= hour) return rtf.format(Math.round(diffMs / hour), "hour");

  return rtf.format(Math.round(diffMs / 60_000), "minute");
}

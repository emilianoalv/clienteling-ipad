import type { Locale } from "@/types/locale";

export type { Locale };

export const locales = ["es-MX", "en-US"] as const satisfies readonly Locale[];

export const defaultLocale: Locale = "es-MX";

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

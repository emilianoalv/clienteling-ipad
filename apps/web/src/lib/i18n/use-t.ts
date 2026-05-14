"use client";

import { useTranslations } from "next-intl";

/**
 * Widened translator type. The project's `IntlMessages` union has grown large
 * enough that next-intl's typed key inference fails to enumerate some leaf
 * paths (the type check still works for the smaller namespaces). Components
 * that hit the limit can call `useT()` instead of `useTranslations()` to
 * bypass the strict key signature.
 *
 * Runtime is unchanged — missing keys still surface via next-intl at render.
 */
export type Translator = (key: string, params?: Record<string, string | number>) => string;

export function useT(): Translator {
  return useTranslations() as unknown as Translator;
}

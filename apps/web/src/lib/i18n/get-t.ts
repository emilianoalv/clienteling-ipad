import "server-only";
import { getTranslations } from "next-intl/server";
import type { Translator } from "./use-t";

/** Server-component counterpart of `useT`. See lib/i18n/use-t.ts for the rationale. */
export async function getT(): Promise<Translator> {
  return (await getTranslations()) as unknown as Translator;
}

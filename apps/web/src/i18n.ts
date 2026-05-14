import { getRequestConfig } from "next-intl/server";
import { defaultLocale, isLocale } from "@/config/i18n";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const active = requested && isLocale(requested) ? requested : defaultLocale;
  const messages = (await import(`./messages/${active}.json`)).default;
  return { locale: active, messages };
});

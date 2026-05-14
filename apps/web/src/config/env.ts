import { z } from "zod";

const envSchema = z.object({
  SESSION_SECRET: z.string().min(16),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_DEFAULT_LOCALE: z.string().default("es-MX"),
  NEXT_PUBLIC_LOCALES: z.string().default("es-MX,en-US"),
});

const parsed = envSchema.safeParse({
  SESSION_SECRET: process.env.SESSION_SECRET,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_DEFAULT_LOCALE: process.env.NEXT_PUBLIC_DEFAULT_LOCALE,
  NEXT_PUBLIC_LOCALES: process.env.NEXT_PUBLIC_LOCALES,
});

if (!parsed.success) {
  throw new Error(
    `Invalid environment variables:\n${JSON.stringify(parsed.error.flatten().fieldErrors, null, 2)}`,
  );
}

export const env = parsed.data;

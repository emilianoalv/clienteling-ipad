import "server-only";

/**
 * Caches a per-module store on `globalThis` so it survives Next.js dev HMR.
 *
 * In dev, editing any file causes Next to rebuild the affected modules. A
 * module-level `Map` / array would re-initialize from seed on every rebuild,
 * losing all writes the BA / Manager / Admin made through Server Actions.
 *
 * Pattern is the standard Next.js trick (same as the canonical PrismaClient
 * singleton). In production, `globalThis[key]` is undefined on cold start so
 * the factory still runs once; F4 replaces this with a real DB anyway.
 */
export function persistent<T>(key: string, factory: () => T): T {
  const g = globalThis as unknown as Record<string, T>;
  if (g[key] === undefined) g[key] = factory();
  return g[key] as T;
}

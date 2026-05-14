import "server-only";

/**
 * Placeholder BA lookup used by the devices screen until a real staff
 * repository exists (F4). The seed devices reference these IDs.
 */
const PLACEHOLDER: Record<string, string> = {
  "ba-demo-ba": "Valentina Ríos",
  "ba-demo-2": "Fernanda Oliveros",
  "ba-demo-3": "Regina Mendoza",
};

export function buildBaLookup(): Readonly<Record<string, string>> {
  return PLACEHOLDER;
}

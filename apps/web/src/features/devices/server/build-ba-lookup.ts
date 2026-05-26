import "server-only";
import { userRepository } from "@/server/repositories/user.repository";

/**
 * Construye el lookup StaffId → nombre completo desde el repositorio real
 * de usuarios. Antes era un placeholder hardcoded con 3 BAs ficticios
 * (ba-demo-ba, ba-demo-2, ba-demo-3) que no matcheaban con los devices
 * del seed real.
 */
export async function buildBaLookup(): Promise<Readonly<Record<string, string>>> {
  const users = await userRepository.list();
  const out: Record<string, string> = {};
  for (const u of users) {
    out[u.id as unknown as string] = u.name;
  }
  return out;
}

import "server-only";
import type { Client, ClientId, ClientStats } from "@/types/client";
import type { BrandId } from "@/types/brand";
import type { StaffId } from "@/types/staff";
import type { StoreId } from "@/types/store";
import { generateId } from "@/lib/id/generate-id";
import { SEED_CLIENTS } from "./seed";
import { persistent } from "./_persist";
import { readOverlayClients, upsertOverlayClient } from "./_overlay";

export interface ClientListFilter {
  query?: string;
  brand?: BrandId;
  /**
   * Brand scope of the requesting staff. A client is visible if at least one of
   * its `brands` is in this set. Mirrors the prototype's brand-lock / BA scope.
   * Omit to disable scoping (Admin/HQ).
   */
  brands?: readonly BrandId[];
  /**
   * Store scope of the requesting staff. A client is visible if its `storeId`
   * is in this set. Use `visibleStoreIds(staff, allStoreIds)` to compute.
   * Omit to disable scoping (Admin/HQ).
   */
  storeIds?: readonly StoreId[];
  /**
   * Ownership filter: BA solo ve clientes cuyo `assignedBaIds` la incluye.
   * `listClients` lo pasa cuando el caller es BA; Gerente/Supervisor/Admin
   * lo omiten para ver todo según su scope de tienda/marca.
   */
  assignedBaId?: StaffId;
}

/**
 * Subset of Client editable from the beauty-profile tab. The repo merges
 * this shallow patch over the existing record. `routineSteps`,
 * `preferredIngredients` and `avoidedIngredients` accepting `undefined`
 * lets the editor clear them when the user removes all chips.
 */
export type ClientProfilePatch = Partial<
  Pick<
    Client,
    | "skin"
    | "allergies"
    | "routine"
    | "routineTiming"
    | "routineSteps"
    | "interests"
    | "preferredIngredients"
    | "avoidedIngredients"
  >
>;

export interface ClientRepository {
  findById(id: ClientId): Promise<Client | null>;
  /**
   * Búsqueda global por contacto (email/teléfono) — sin scope. La usa el
   * flujo de "registrar cliente" para evitar duplicados: cuando una BA
   * busca y encuentra una clienta de otra BA o marca, agrega su id al
   * assignedBaIds en lugar de crear duplicado.
   */
  findByContact(query: string): Promise<Client | null>;
  list(filter?: ClientListFilter): Promise<Client[]>;
  create(input: Omit<Client, "id">): Promise<Client>;
  patchStats(id: ClientId, stats: ClientStats): Promise<void>;
  patchProfile(id: ClientId, patch: ClientProfilePatch): Promise<Client | null>;
  /**
   * Agrega un BA al assignedBaIds del cliente y, si la marca pasada no está
   * en client.brands, también la agrega (auto-vinculación multi-brand).
   * Idempotente: si ya estaba, no duplica.
   */
  linkBa(id: ClientId, baId: StaffId, brand: BrandId): Promise<Client | null>;
  /** Borrado físico — paso final del cascade ARCO. */
  delete(id: ClientId): Promise<boolean>;
}

// v5 invalida v4: el seed agregó a Alma Beltrán como clienta demo de
// Valentina Ríos. Bumpear fuerza recarga del seed en el cache del browser
// (la versión anterior puede tener una lista de clientes sin Alma).
const CLIENTS = persistent(
  "__clienteling.clients.v5",
  () => new Map<ClientId, Client>(SEED_CLIENTS.map((c) => [c.id, c])),
);

/**
 * Merge overlay-first + seed in-memory, deduped por id. Necesario porque en
 * Vercel serverless las escrituras en `CLIENTS` (in-memory) no sobreviven el
 * salto entre lambdas — los nuevos clientes desaparecían y sus compras
 * subsiguientes se mostraban como "Cliente eliminado".
 */
async function mergedClients(): Promise<Map<string, Client>> {
  const overlay = await readOverlayClients();
  const merged = new Map<string, Client>();
  // Seed primero, overlay después → overlay sobreescribe (autoritativo).
  for (const [id, c] of CLIENTS.entries()) merged.set(id as unknown as string, c);
  for (const c of overlay) merged.set(c.id as unknown as string, c);
  return merged;
}

export const clientRepository: ClientRepository = {
  async findById(id) {
    const merged = await mergedClients();
    return merged.get(id as unknown as string) ?? null;
  },

  async findByContact(query) {
    const needle = query.trim().toLowerCase();
    if (!needle) return null;
    const digits = needle.replace(/\D/g, "");
    const merged = await mergedClients();
    for (const c of merged.values()) {
      if (c.email.toLowerCase() === needle) return c;
      const phoneDigits = c.phone.replace(/\D/g, "");
      if (digits.length >= 7 && phoneDigits.endsWith(digits)) return c;
    }
    return null;
  },

  async list(filter = {}) {
    const merged = await mergedClients();
    const all = Array.from(merged.values());
    const query = filter.query?.trim().toLowerCase();
    const brandScope = filter.brands;
    const storeScope = filter.storeIds;
    const baFilter = filter.assignedBaId;
    return all.filter((c) => {
      if (filter.brand && !c.brands.includes(filter.brand)) return false;
      if (brandScope && brandScope.length && !c.brands.some((b) => brandScope.includes(b))) return false;
      if (storeScope && storeScope.length && !storeScope.includes(c.storeId)) return false;
      if (baFilter && !(c.assignedBaIds ?? []).includes(baFilter)) return false;
      if (!query) return true;
      const haystack = `${c.name} ${c.email} ${c.phone}`.toLowerCase();
      return haystack.includes(query);
    });
  },

  async create(input) {
    const id = generateId("cl") as ClientId;
    const client: Client = { ...input, id };
    CLIENTS.set(id, client);
    await upsertOverlayClient(client);
    return client;
  },

  async patchStats(id, stats) {
    // Buscamos primero en seed in-memory; si no, en overlay (caso típico
    // post-venta de un cliente recién creado en otro lambda).
    let current = CLIENTS.get(id) ?? null;
    if (!current) {
      const overlay = await readOverlayClients();
      current = overlay.find((c) => c.id === id) ?? null;
    }
    if (!current) return;
    const next: Client = { ...current, stats };
    CLIENTS.set(id, next);
    await upsertOverlayClient(next);
  },

  async delete(id) {
    return CLIENTS.delete(id);
  },

  async linkBa(id, baId, brand) {
    let current = CLIENTS.get(id) ?? null;
    if (!current) {
      const overlay = await readOverlayClients();
      current = overlay.find((c) => c.id === id) ?? null;
    }
    if (!current) return null;
    const currentAssigned = current.assignedBaIds ?? [];
    const alreadyHasBa = currentAssigned.includes(baId);
    const alreadyHasBrand = current.brands.includes(brand);
    if (alreadyHasBa && alreadyHasBrand) return current;
    const next: Client = {
      ...current,
      assignedBaIds: alreadyHasBa ? currentAssigned : [...currentAssigned, baId],
      brands: alreadyHasBrand ? current.brands : [...current.brands, brand],
    };
    CLIENTS.set(id, next);
    await upsertOverlayClient(next);
    return next;
  },

  async patchProfile(id, patch) {
    let current = CLIENTS.get(id) ?? null;
    if (!current) {
      const overlay = await readOverlayClients();
      current = overlay.find((c) => c.id === id) ?? null;
    }
    if (!current) return null;
    const next: Client = { ...current, ...patch };
    if ("routineSteps" in patch && patch.routineSteps === undefined) {
      delete (next as Partial<Client>).routineSteps;
    }
    if ("preferredIngredients" in patch && patch.preferredIngredients === undefined) {
      delete (next as Partial<Client>).preferredIngredients;
    }
    if ("avoidedIngredients" in patch && patch.avoidedIngredients === undefined) {
      delete (next as Partial<Client>).avoidedIngredients;
    }
    CLIENTS.set(id, next);
    await upsertOverlayClient(next);
    return next;
  },
};

import "server-only";
import type { Client, ClientId, ClientStats } from "@/types/client";
import type { BrandId } from "@/types/brand";
import type { StaffId } from "@/types/staff";
import type { StoreId } from "@/types/store";
import { generateId } from "@/lib/id/generate-id";
import { SEED_CLIENTS } from "./seed";
import { persistent } from "./_persist";

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

// v4 invalida v3 para que el seed cargue con assignedBaIds + createdByBaId
// recién agregados — antes los clientes eran agnósticos al BA y todos
// los BAs de una tienda/marca veían los mismos. Ahora cada BA solo ve
// clientes que la han incluido como assignedBa.
const CLIENTS = persistent(
  "__clienteling.clients.v4",
  () => new Map<ClientId, Client>(SEED_CLIENTS.map((c) => [c.id, c])),
);

export const clientRepository: ClientRepository = {
  async findById(id) {
    return CLIENTS.get(id) ?? null;
  },

  async findByContact(query) {
    const needle = query.trim().toLowerCase();
    if (!needle) return null;
    // Normaliza el query: si parece teléfono (dígitos), busca por sufijo de
    // 10 dígitos para tolerar variantes con/sin code "+52".
    const digits = needle.replace(/\D/g, "");
    for (const c of CLIENTS.values()) {
      if (c.email.toLowerCase() === needle) return c;
      const phoneDigits = c.phone.replace(/\D/g, "");
      if (digits.length >= 7 && phoneDigits.endsWith(digits)) return c;
    }
    return null;
  },

  async list(filter = {}) {
    const all = Array.from(CLIENTS.values());
    const query = filter.query?.trim().toLowerCase();
    const brandScope = filter.brands;
    const storeScope = filter.storeIds;
    const baFilter = filter.assignedBaId;
    return all.filter((c) => {
      if (filter.brand && !c.brands.includes(filter.brand)) return false;
      if (brandScope && brandScope.length && !c.brands.some((b) => brandScope.includes(b))) return false;
      if (storeScope && storeScope.length && !storeScope.includes(c.storeId)) return false;
      if (baFilter && !c.assignedBaIds.includes(baFilter)) return false;
      if (!query) return true;
      const haystack = `${c.name} ${c.email} ${c.phone}`.toLowerCase();
      return haystack.includes(query);
    });
  },

  async create(input) {
    const id = generateId("cl") as ClientId;
    const client: Client = { ...input, id };
    CLIENTS.set(id, client);
    return client;
  },

  async patchStats(id, stats) {
    const current = CLIENTS.get(id);
    if (!current) return;
    CLIENTS.set(id, { ...current, stats });
  },

  async delete(id) {
    return CLIENTS.delete(id);
  },

  async linkBa(id, baId, brand) {
    const current = CLIENTS.get(id);
    if (!current) return null;
    const alreadyHasBa = current.assignedBaIds.includes(baId);
    const alreadyHasBrand = current.brands.includes(brand);
    if (alreadyHasBa && alreadyHasBrand) return current;
    const next: Client = {
      ...current,
      assignedBaIds: alreadyHasBa
        ? current.assignedBaIds
        : [...current.assignedBaIds, baId],
      brands: alreadyHasBrand ? current.brands : [...current.brands, brand],
    };
    CLIENTS.set(id, next);
    return next;
  },

  async patchProfile(id, patch) {
    const current = CLIENTS.get(id);
    if (!current) return null;
    // Build merged client; explicitly drop keys set to undefined so the
    // editor can clear optional fields (routineSteps, ingredient lists).
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
    return next;
  },
};

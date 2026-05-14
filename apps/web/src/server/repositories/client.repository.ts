import "server-only";
import type { Client, ClientId, ClientStats } from "@/types/client";
import type { BrandId } from "@/types/brand";
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
}

export interface ClientRepository {
  findById(id: ClientId): Promise<Client | null>;
  list(filter?: ClientListFilter): Promise<Client[]>;
  create(input: Omit<Client, "id">): Promise<Client>;
  patchStats(id: ClientId, stats: ClientStats): Promise<void>;
}

const CLIENTS = persistent(
  "__clienteling.clients",
  () => new Map<ClientId, Client>(SEED_CLIENTS.map((c) => [c.id, c])),
);

export const clientRepository: ClientRepository = {
  async findById(id) {
    return CLIENTS.get(id) ?? null;
  },

  async list(filter = {}) {
    const all = Array.from(CLIENTS.values());
    const query = filter.query?.trim().toLowerCase();
    const scope = filter.brands;
    return all.filter((c) => {
      if (filter.brand && !c.brands.includes(filter.brand)) return false;
      if (scope && scope.length && !c.brands.some((b) => scope.includes(b))) return false;
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
};

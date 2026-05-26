import "server-only";
import type { Store, StoreId } from "@/types/store";
import { persistent } from "./_persist";

const SEED: Store[] = [
  {
    id: "st-pol" as StoreId,
    name: "Liverpool Polanco",
    chain: "Liverpool",
    city: "CDMX",
    address: "Mariano Escobedo 425",
    monthlyTarget: 1_800_000,
  },
  {
    id: "st-per" as StoreId,
    name: "Liverpool Perisur",
    chain: "Liverpool",
    city: "CDMX",
    address: "Periférico Sur 4690",
    monthlyTarget: 1_500_000,
  },
  {
    id: "st-stf" as StoreId,
    name: "Palacio Santa Fe",
    chain: "Palacio",
    city: "CDMX",
    address: "Vasco de Quiroga 3800",
    monthlyTarget: 2_000_000,
  },
];

// v2 invalida v1 — ahora el repo soporta create/update/delete, antes era
// un Map de solo lectura sembrado en módulo. Persistir entre HMRs deja al
// Admin probar el CRUD sin perder la altas cada vez que se recompila.
const STORES = persistent(
  "__clienteling.stores.v2",
  () => new Map<StoreId, Store>(SEED.map((s) => [s.id, s])),
);

export interface StoreRepository {
  list(): Promise<Store[]>;
  findById(id: StoreId): Promise<Store | null>;
  create(input: Omit<Store, "id"> & { id: StoreId }): Promise<Store>;
  update(id: StoreId, patch: Partial<Omit<Store, "id">>): Promise<Store | null>;
  delete(id: StoreId): Promise<boolean>;
}

export const storeRepository: StoreRepository = {
  async list() {
    return Array.from(STORES.values());
  },
  async findById(id) {
    return STORES.get(id) ?? null;
  },
  async create(input) {
    STORES.set(input.id, input);
    return input;
  },
  async update(id, patch) {
    const current = STORES.get(id);
    if (!current) return null;
    const next: Store = { ...current, ...patch, id };
    STORES.set(id, next);
    return next;
  },
  async delete(id) {
    return STORES.delete(id);
  },
};

import "server-only";
import type { Store, StoreId } from "@/types/store";

const SEED: Store[] = [
  {
    id: "st-pol" as StoreId,
    name: "Liverpool Polanco",
    chain: "Liverpool",
    city: "CDMX",
    address: "Mariano Escobedo 425",
  },
  {
    id: "st-per" as StoreId,
    name: "Liverpool Perisur",
    chain: "Liverpool",
    city: "CDMX",
    address: "Periférico Sur 4690",
  },
  {
    id: "st-stf" as StoreId,
    name: "Palacio Santa Fe",
    chain: "Palacio",
    city: "CDMX",
    address: "Vasco de Quiroga 3800",
  },
];

const STORES = new Map<StoreId, Store>(SEED.map((s) => [s.id, s]));

export interface StoreRepository {
  list(): Promise<Store[]>;
  findById(id: StoreId): Promise<Store | null>;
}

export const storeRepository: StoreRepository = {
  async list() {
    return Array.from(STORES.values());
  },
  async findById(id) {
    return STORES.get(id) ?? null;
  },
};

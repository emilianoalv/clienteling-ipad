import "server-only";
import type { Store, StoreId } from "@/types/store";

const SEED: Store[] = [
  {
    id: "st-polanco" as StoreId,
    name: "Liverpool Polanco",
    chain: "Liverpool",
    city: "CDMX",
    address: "Mariano Escobedo 425",
  },
  {
    id: "st-santa-fe" as StoreId,
    name: "Liverpool Santa Fe",
    chain: "Liverpool",
    city: "CDMX",
    address: "Vasco de Quiroga 3800",
  },
  {
    id: "st-palacio-polanco" as StoreId,
    name: "Palacio de Hierro Polanco",
    chain: "Palacio",
    city: "CDMX",
    address: "Moliere 222",
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

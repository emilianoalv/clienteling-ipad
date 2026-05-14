import "server-only";
import type { BrandId } from "@/types/brand";
import type { ClientId } from "@/types/client";
import type { Sample } from "@/types/sample";
import { SEED_SAMPLES } from "./seed";
import { persistent } from "./_persist";

export interface SampleInventoryItem {
  sku: string;
  name: string;
  have: number;
  capacity: number;
  brand: BrandId;
}

export interface SampleListFilter {
  brands?: readonly BrandId[];
}

export interface SampleRepository {
  list(filter?: SampleListFilter): Promise<Sample[]>;
  listByClient(clientId: ClientId): Promise<Sample[]>;
  listInventory(filter?: { brands?: readonly BrandId[] }): Promise<SampleInventoryItem[]>;
}

const SAMPLES: Sample[] = persistent("__clienteling.samples", () => [...SEED_SAMPLES]);

const INVENTORY: SampleInventoryItem[] = persistent("__clienteling.sampleInventory", () => [
  { sku: "LC-REN-5", name: "Rénergie H.C.F. sample 5ml", have: 42, capacity: 60, brand: "Lancôme" },
  { sku: "LC-ABS-5", name: "Absolue crema 5ml", have: 18, capacity: 40, brand: "Lancôme" },
  { sku: "LC-GEN-7", name: "Advanced Génifique 7ml", have: 31, capacity: 50, brand: "Lancôme" },
  { sku: "YS-LIB-1", name: "Libre EDP 1.2ml vial", have: 9, capacity: 30, brand: "YSL" },
  { sku: "YS-OR-5", name: "Or Rouge crema 5ml", have: 4, capacity: 20, brand: "YSL" },
  { sku: "YS-OPI-1", name: "Black Opium 1.2ml vial", have: 12, capacity: 30, brand: "YSL" },
]);

export const sampleRepository: SampleRepository = {
  async list() {
    return [...SAMPLES].sort((a, b) => b.givenAt.localeCompare(a.givenAt));
  },

  async listByClient(clientId) {
    return SAMPLES.filter((s) => s.clientId === clientId).sort((a, b) =>
      b.givenAt.localeCompare(a.givenAt),
    );
  },

  async listInventory(filter = {}) {
    const scope = filter.brands;
    if (!scope || scope.length === 0) return [...INVENTORY];
    return INVENTORY.filter((i) => scope.includes(i.brand));
  },
};

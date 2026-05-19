import "server-only";
import type { BrandId } from "@/types/brand";
import type { ClientId } from "@/types/client";
import type { Sample, SampleId } from "@/types/sample";
import type { StoreId } from "@/types/store";
import { SEED_SAMPLES } from "./seed";
import { persistent } from "./_persist";
import { generateId } from "@/lib/id/generate-id";

export interface SampleInventoryItem {
  sku: string;
  name: string;
  have: number;
  capacity: number;
  brand: BrandId;
}

export interface SampleListFilter {
  brands?: readonly BrandId[];
  storeIds?: readonly StoreId[];
  /** Inclusive lower bound on `givenAt`. */
  from?: Date;
  /** Exclusive upper bound on `givenAt`. */
  to?: Date;
}

export interface SampleRepository {
  list(filter?: SampleListFilter): Promise<Sample[]>;
  listByClient(clientId: ClientId): Promise<Sample[]>;
  listInventory(filter?: { brands?: readonly BrandId[] }): Promise<SampleInventoryItem[]>;
  create(input: Omit<Sample, "id">): Promise<Sample>;
}

const SAMPLES: Sample[] = persistent("__clienteling.samples.v2", () => [...SEED_SAMPLES]);

const INVENTORY: SampleInventoryItem[] = persistent("__clienteling.sampleInventory.v2", () => [
  // ── Lancôme · skincare ────────────────────────────────────────────────────
  { sku: "LC-GEN-7", name: "Advanced Génifique 7ml", have: 31, capacity: 50, brand: "Lancôme" },
  { sku: "LC-REN-5", name: "Rénergie H.C.F. sample 5ml", have: 42, capacity: 60, brand: "Lancôme" },
  { sku: "LC-ABS-5", name: "Absolue Soft Cream 5ml", have: 18, capacity: 40, brand: "Lancôme" },
  { sku: "LC-AEC-3", name: "Absolue Eye Cream 3ml", have: 22, capacity: 35, brand: "Lancôme" },
  { sku: "LC-HZN-7", name: "Hydra Zen Gel Cream 7ml", have: 28, capacity: 45, brand: "Lancôme" },
  // ── Lancôme · fragancias (vials 1.5ml) ───────────────────────────────────
  { sku: "LC-IDP-1", name: "Idôle EDP 1.5ml vial", have: 14, capacity: 30, brand: "Lancôme" },
  { sku: "LC-LVE-1", name: "La Vie Est Belle EDP 1.5ml vial", have: 19, capacity: 40, brand: "Lancôme" },
  { sku: "LC-TRE-1", name: "Trésor EDP 1.5ml vial", have: 8, capacity: 25, brand: "Lancôme" },
  { sku: "LC-MIR-1", name: "Miracle EDP 1.5ml vial", have: 11, capacity: 25, brand: "Lancôme" },
  // ── YSL ──────────────────────────────────────────────────────────────────
  { sku: "YS-LIB-1", name: "Libre EDP 1.2ml vial", have: 9, capacity: 30, brand: "YSL" },
  { sku: "YS-OR-5", name: "Or Rouge crema 5ml", have: 4, capacity: 20, brand: "YSL" },
  { sku: "YS-OPI-1", name: "Black Opium 1.2ml vial", have: 12, capacity: 30, brand: "YSL" },
]);

export const sampleRepository: SampleRepository = {
  async list(filter = {}) {
    const brandScope = filter.brands;
    const storeScope = filter.storeIds;
    return SAMPLES.filter((s) => {
      if (brandScope && brandScope.length && !brandScope.includes(s.brand)) return false;
      if (storeScope && storeScope.length && !storeScope.includes(s.storeId)) return false;
      const at = new Date(s.givenAt);
      if (filter.from && at < filter.from) return false;
      if (filter.to && at >= filter.to) return false;
      return true;
    }).sort((a, b) => b.givenAt.localeCompare(a.givenAt));
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

  async create(input) {
    const id = generateId("sm") as SampleId;
    const sample: Sample = { ...input, id };
    SAMPLES.unshift(sample);
    return sample;
  },
};

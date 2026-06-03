import "server-only";
import type { BrandId } from "@/types/brand";
import type { ClientId } from "@/types/client";
import type { PurchaseId } from "@/types/purchase";
import type { Sample, SampleId } from "@/types/sample";
import type { StoreId } from "@/types/store";
import { SEED_SAMPLES } from "./seed";
import { MAY_2026_SAMPLES } from "./seed-may-2026";
import { DEEP_2026_SAMPLES } from "./seed-deep-2026";
import { persistent } from "./_persist";
import {
  appendOverlaySample,
  readOverlaySamples,
  upsertOverlaySample,
} from "./_overlay";
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
  /**
   * BA ownership filter — solo el BA pasa su id aquí. Cuando viene, la lista
   * devuelta solo incluye muestras dadas por ese BA (sample.baId === id).
   * Otros roles lo dejan undefined para ver el counter/zona completo.
   */
  baId?: import("@/types/staff").StaffId;
}

export interface SampleRepository {
  list(filter?: SampleListFilter): Promise<Sample[]>;
  listByClient(
    clientId: ClientId,
    filter?: { brands?: readonly BrandId[] },
  ): Promise<Sample[]>;
  findById(id: SampleId): Promise<Sample | null>;
  listInventory(filter?: { brands?: readonly BrandId[] }): Promise<SampleInventoryItem[]>;
  /**
   * Ajusta `have` y/o `capacity` de un SKU del inventario. Para "recibir
   * lote nuevo" la UI suma la cantidad recibida al `have` actual antes de
   * llamar acá (no exponemos un increment para no tener que doblar la
   * semántica de la API). Devuelve null si el SKU no existe.
   */
  updateInventory(
    sku: string,
    patch: { have?: number; capacity?: number },
  ): Promise<SampleInventoryItem | null>;
  create(input: Omit<Sample, "id">): Promise<Sample>;
  markConverted(id: SampleId, purchaseId: PurchaseId): Promise<Sample | null>;
  /** ARCO cascade — borra todas las muestras dadas a un cliente. */
  deleteByClient(clientId: ClientId): Promise<number>;
}

const SAMPLES: Sample[] = persistent("__clienteling.samples.v6", () => [
  ...SEED_SAMPLES,
  ...MAY_2026_SAMPLES,
  ...DEEP_2026_SAMPLES,
]);

// v5 unifica el sufijo de las muestras al patrón "-7" para que coincida con
// el seed (MAY 2026 + WEEK JUN 2026) y con el sampleSku del catálogo. Antes
// la BA entregaba una muestra LC-REN-7 pero el inventario solo conocía
// LC-REN-5 → la imagen del producto no resolvía y el decremento no ocurría.
const INVENTORY: SampleInventoryItem[] = persistent("__clienteling.sampleInventory.v5", () => [
  // ── Lancôme · skincare ────────────────────────────────────────────────────
  { sku: "LC-GEN-7", name: "Advanced Génifique 7ml", have: 31, capacity: 50, brand: "Lancôme" },
  { sku: "LC-REN-7", name: "Rénergie H.C.F. sample 7ml", have: 42, capacity: 60, brand: "Lancôme" },
  { sku: "LC-ABS-7", name: "Absolue Soft Cream 7ml", have: 18, capacity: 40, brand: "Lancôme" },
  { sku: "LC-AEC-3", name: "Absolue Eye Cream 3ml", have: 22, capacity: 35, brand: "Lancôme" },
  { sku: "LC-HZN-7", name: "Hydra Zen Gel Cream 7ml", have: 28, capacity: 45, brand: "Lancôme" },
  // ── Lancôme · fragancias (vials 1.5ml) ───────────────────────────────────
  { sku: "LC-IDP-1", name: "Idôle EDP 1.5ml vial", have: 14, capacity: 30, brand: "Lancôme" },
  { sku: "LC-LVE-1", name: "La Vie Est Belle EDP 1.5ml vial", have: 19, capacity: 40, brand: "Lancôme" },
  { sku: "LC-LIA-1", name: "La Vie Est Belle Iris Absolu 1.5ml vial", have: 6, capacity: 20, brand: "Lancôme" },
  { sku: "LC-TRE-1", name: "Trésor EDP 1.5ml vial", have: 8, capacity: 25, brand: "Lancôme" },
  { sku: "LC-MIR-1", name: "Miracle EDP 1.5ml vial", have: 11, capacity: 25, brand: "Lancôme" },
  // ── YSL · skincare ───────────────────────────────────────────────────────
  { sku: "YS-OR-5", name: "Or Rouge sérum 5ml", have: 12, capacity: 25, brand: "YSL" },
  { sku: "YS-PSE-3", name: "Pure Shots Y-Shape Eye 3ml", have: 15, capacity: 30, brand: "YSL" },
  { sku: "YS-RPC-7", name: "Rouge Pur Couture sample", have: 20, capacity: 35, brand: "YSL" },
  // ── YSL · fragancias (vials 1.2ml) ───────────────────────────────────────
  { sku: "YS-LIB-7", name: "Libre EDP 1.2ml vial", have: 22, capacity: 40, brand: "YSL" },
  { sku: "YS-BO-7", name: "Black Opium EDP 1.2ml vial", have: 24, capacity: 40, brand: "YSL" },
  { sku: "YS-Y-1", name: "Y EDP Hombre 1.2ml vial", have: 18, capacity: 35, brand: "YSL" },
  { sku: "YS-MYS-7", name: "MYSLF EDP Hombre 1.2ml vial", have: 16, capacity: 35, brand: "YSL" },
]);

/** Overlay primero (cookies) + seed in-memory, deduped por id. */
async function mergedSamples(): Promise<Sample[]> {
  const overlay = await readOverlaySamples();
  const seen = new Set<string>(overlay.map((s) => s.id as unknown as string));
  const merged: Sample[] = [...overlay];
  for (const s of SAMPLES) {
    if (seen.has(s.id as unknown as string)) continue;
    merged.push(s);
  }
  return merged;
}

export const sampleRepository: SampleRepository = {
  async list(filter = {}) {
    const brandScope = filter.brands;
    const storeScope = filter.storeIds;
    const baFilter = filter.baId;
    const all = await mergedSamples();
    return all.filter((s) => {
      if (brandScope && brandScope.length && !brandScope.includes(s.brand)) return false;
      if (storeScope && storeScope.length && !storeScope.includes(s.storeId)) return false;
      if (baFilter && s.baId !== baFilter) return false;
      const at = new Date(s.givenAt);
      if (filter.from && at < filter.from) return false;
      if (filter.to && at >= filter.to) return false;
      return true;
    }).sort((a, b) => b.givenAt.localeCompare(a.givenAt));
  },

  async listByClient(clientId, filter = {}) {
    const brandScope = filter.brands;
    const all = await mergedSamples();
    return all
      .filter((s) => {
        if (s.clientId !== clientId) return false;
        if (brandScope && brandScope.length && !brandScope.includes(s.brand)) return false;
        return true;
      })
      .sort((a, b) => b.givenAt.localeCompare(a.givenAt));
  },

  async findById(id) {
    const all = await mergedSamples();
    return all.find((s) => s.id === id) ?? null;
  },

  async listInventory(filter = {}) {
    const scope = filter.brands;
    if (!scope || scope.length === 0) return [...INVENTORY];
    return INVENTORY.filter((i) => scope.includes(i.brand));
  },

  async updateInventory(sku, patch) {
    const idx = INVENTORY.findIndex((i) => i.sku === sku);
    if (idx < 0) return null;
    const current = INVENTORY[idx]!;
    const next: SampleInventoryItem = {
      ...current,
      ...(patch.have !== undefined ? { have: Math.max(0, patch.have) } : {}),
      ...(patch.capacity !== undefined
        ? { capacity: Math.max(0, patch.capacity) }
        : {}),
    };
    INVENTORY[idx] = next;
    return next;
  },

  async create(input) {
    const id = generateId("sm") as SampleId;
    const sample: Sample = { ...input, id };
    SAMPLES.unshift(sample);
    await appendOverlaySample(sample);
    return sample;
  },

  async markConverted(id, purchaseId) {
    const idx = SAMPLES.findIndex((s) => s.id === id);
    let next: Sample | null = null;
    if (idx >= 0) {
      const current = SAMPLES[idx]!;
      next = { ...current, converted: true, purchaseId };
      SAMPLES[idx] = next;
    } else {
      // Item live solo en overlay (creado en otro lambda).
      const overlay = await readOverlaySamples();
      const found = overlay.find((s) => s.id === id);
      if (!found) return null;
      next = { ...found, converted: true, purchaseId };
    }
    await upsertOverlaySample(next);
    return next;
  },

  async deleteByClient(clientId) {
    let removed = 0;
    for (let i = SAMPLES.length - 1; i >= 0; i--) {
      if (SAMPLES[i]!.clientId === clientId) {
        SAMPLES.splice(i, 1);
        removed++;
      }
    }
    return removed;
  },
};

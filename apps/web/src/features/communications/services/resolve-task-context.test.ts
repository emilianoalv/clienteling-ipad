import { describe, expect, it } from "vitest";
import type { ClientId } from "@/types/client";
import type {
  FollowupCategory,
  FollowupTask,
  FollowupTaskId,
} from "@/types/followup-task";
import type { Product, Sku } from "@/types/product";
import type { Purchase, PurchaseId } from "@/types/purchase";
import type { Sample, SampleId } from "@/types/sample";
import type { StaffId } from "@/types/staff";
import type { StoreId } from "@/types/store";
import type { ResolveTaskContextDeps } from "./resolve-task-context";
import { resolveTaskContext } from "./resolve-task-context";

const NOW = new Date("2026-05-22T12:00:00Z"); // viernes
const CLIENT = "cl-1" as ClientId;
const BA = "ba-1" as StaffId;
const STORE = "st-1" as StoreId;

function task(category: FollowupCategory): FollowupTask {
  return {
    id: "ft-1" as FollowupTaskId,
    clientId: CLIENT,
    baId: BA,
    type: "whatsapp",
    category,
    description: "x",
    dueAt: NOW.toISOString(),
    status: "pending",
    createdAt: NOW.toISOString(),
  };
}

function sample(opts: Partial<Sample> = {}): Sample {
  return {
    id: "sm-1" as SampleId,
    clientId: CLIENT,
    baId: BA,
    storeId: STORE,
    brand: "Lancôme",
    sku: "LC-IDP-1" as Sku,
    name: "Idôle EDP 1.5ml vial",
    givenAt: new Date(NOW.getTime() - 4 * 86_400_000).toISOString(), // 4 días atrás = lunes
    converted: false,
    ...opts,
  };
}

function purchase(opts: Partial<Purchase> = {}): Purchase {
  return {
    id: "pu-1" as PurchaseId,
    clientId: CLIENT,
    baId: BA,
    storeId: STORE,
    at: new Date(NOW.getTime() - 21 * 86_400_000).toISOString(), // hace 3 semanas
    items: [{ sku: "LC-GEN-30" as Sku, qty: 1, unitPrice: 1990 }],
    total: 1990,
    payment: "card",
    brand: "Lancôme",
    ...opts,
  };
}

function product(opts: Partial<Product> = {}): Product {
  return {
    sku: "LC-GEN-30" as Sku,
    brand: "Lancôme",
    line: "Génifique",
    name: "Génifique Sérum 30ml",
    size: "30ml",
    price: 1990,
    stock: {},
    attrs: {},
    howTo: "",
    selling: [],
    lifecycleDays: 90,
    ...opts,
  };
}

function makeDeps(opts: {
  samples?: readonly Sample[];
  purchases?: readonly Purchase[];
  products?: readonly Product[];
} = {}): ResolveTaskContextDeps {
  const samples = opts.samples ?? [];
  const purchases = opts.purchases ?? [];
  const products = opts.products ?? [];
  return {
    listSamplesByClient: async (id) => samples.filter((s) => s.clientId === id),
    listPurchasesByClient: async (id) => purchases.filter((p) => p.clientId === id),
    findProductBySku: async (sku) => products.find((p) => p.sku === sku) ?? null,
  };
}

describe("resolveTaskContext", () => {
  it("sample-feedback resuelve nombre + día relativo", async () => {
    const ctx = await resolveTaskContext(
      task("sample-feedback"),
      NOW,
      makeDeps({ samples: [sample()] }),
    );
    expect(ctx["muestra.producto"]).toBe("Idôle EDP 1.5ml vial");
    expect(ctx["muestra.dia"]).toBe("el lunes");
  });

  it("sample-feedback sin muestras devuelve {} (fallback opción A)", async () => {
    const ctx = await resolveTaskContext(
      task("sample-feedback"),
      NOW,
      makeDeps({ samples: [] }),
    );
    expect(ctx).toEqual({});
  });

  it("post-purchase resuelve producto + día + fecha corta", async () => {
    const ctx = await resolveTaskContext(
      task("post-purchase"),
      NOW,
      makeDeps({ purchases: [purchase()], products: [product()] }),
    );
    expect(ctx["compra.producto"]).toBe("Génifique Sérum 30ml");
    expect(ctx["compra.productos"]).toBe("Génifique Sérum 30ml");
    expect(ctx["compra.productos.lista"]).toBe("• Génifique Sérum 30ml");
    expect(ctx["compra.dia"]).toBe("hace 3 semanas");
    expect(ctx["compra.fecha"]).toMatch(/\d+\s+\w+/); // "1 may", "30 abr", etc.
  });

  it("post-purchase con 2 productos lista ambos en frase natural", async () => {
    const p1 = product();
    const p2 = product({
      sku: "LC-ABS-50" as Sku,
      name: "Absolue Soft Cream",
    });
    const pu = purchase({
      items: [
        { sku: "LC-GEN-30" as Sku, qty: 1, unitPrice: 1990 },
        { sku: "LC-ABS-50" as Sku, qty: 1, unitPrice: 6700 },
      ],
    });
    const ctx = await resolveTaskContext(
      task("post-purchase"),
      NOW,
      makeDeps({ purchases: [pu], products: [p1, p2] }),
    );
    expect(ctx["compra.producto"]).toBe("Génifique Sérum 30ml");
    expect(ctx["compra.productos"]).toBe("Génifique Sérum 30ml y Absolue Soft Cream");
    expect(ctx["compra.productos.lista"]).toBe(
      "• Génifique Sérum 30ml\n• Absolue Soft Cream",
    );
  });

  it("post-purchase con 3 productos usa coma + 'y' al final", async () => {
    const items = [
      { sku: "LC-GEN-30" as Sku, qty: 1, unitPrice: 1990 },
      { sku: "LC-ABS-50" as Sku, qty: 1, unitPrice: 6700 },
      { sku: "LC-IDP-50" as Sku, qty: 1, unitPrice: 2400 },
    ];
    const pu = purchase({ items });
    const products = [
      product(),
      product({ sku: "LC-ABS-50" as Sku, name: "Absolue Soft Cream" }),
      product({ sku: "LC-IDP-50" as Sku, name: "Idôle EDP" }),
    ];
    const ctx = await resolveTaskContext(
      task("post-purchase"),
      NOW,
      makeDeps({ purchases: [pu], products }),
    );
    expect(ctx["compra.productos"]).toBe(
      "Génifique Sérum 30ml, Absolue Soft Cream y Idôle EDP",
    );
  });

  it("replenishment y check-ins comparten resolución de compra", async () => {
    const deps = makeDeps({ purchases: [purchase()], products: [product()] });
    const repl = await resolveTaskContext(task("replenishment"), NOW, deps);
    const m3 = await resolveTaskContext(task("3-month-check"), NOW, deps);
    const m6 = await resolveTaskContext(task("6-month-check"), NOW, deps);
    expect(repl["compra.producto"]).toBe("Génifique Sérum 30ml");
    expect(m3["compra.producto"]).toBe("Génifique Sérum 30ml");
    expect(m6["compra.producto"]).toBe("Génifique Sérum 30ml");
  });

  it("compra sin lookup de producto deja compra.producto undefined", async () => {
    const ctx = await resolveTaskContext(
      task("post-purchase"),
      NOW,
      makeDeps({ purchases: [purchase()], products: [] }),
    );
    expect(ctx["compra.producto"]).toBeUndefined();
    expect(ctx["compra.dia"]).toBe("hace 3 semanas");
  });

  it.each(["birthday", "special-event", "general"] as const)(
    "categoría '%s' no necesita contexto y devuelve {}",
    async (category) => {
      const ctx = await resolveTaskContext(task(category), NOW, makeDeps());
      expect(ctx).toEqual({});
    },
  );
});

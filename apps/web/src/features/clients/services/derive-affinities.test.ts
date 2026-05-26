import { describe, expect, it } from "vitest";
import type { Client, ClientId } from "@/types/client";
import type { Product, Sku } from "@/types/product";
import type { Purchase, PurchaseId } from "@/types/purchase";
import type { StaffId } from "@/types/staff";
import type { StoreId } from "@/types/store";
import { deriveAffinities } from "./derive-affinities";

function makeClient(overrides: Partial<Client> = {}): Client {
  return {
    id: "cl-1" as ClientId,
    name: "Regina",
    phone: "+52 5555",
    email: "regina@test.mx",
    birthday: "1990-01-01",
    city: "CDMX",
    age: 35,
    preferredLang: "es-MX",
    since: "2024-01-01",
    tier: "Atelier",
    brands: ["Lancôme"],
    storeId: "st-pol" as StoreId,
    skin: { type: "Mixta", concerns: [], tone: "Medio" },
    allergies: [],
    loyalty: { name: "Luxe Circle", tier: "Atelier", points: 0, toNext: 10_000 },
    stats: { ltv: 0, visits: 0, avgTicket: 0, lastPurchase: null },
    affinities: [],
    interests: [],
    routine: "Básica",
    ...overrides,
  };
}

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    sku: "LC-GEN-50" as Sku,
    brand: "Lancôme",
    line: "Génifique",
    name: "Sérum",
    size: "50ml",
    price: 2250,
    stock: {},
    attrs: { tipo: "Sérum" },
    howTo: "",
    selling: [],
    lifecycleDays: 90,
    ...overrides,
  };
}

function purchase(items: readonly { sku: string; qty: number }[]): Purchase {
  return {
    id: `pu-${Math.random()}` as PurchaseId,
    clientId: "cl-1" as ClientId,
    baId: "ba-1" as StaffId,
    storeId: "st-pol" as StoreId,
    at: "2026-01-01T00:00:00Z",
    items: items.map((i) => ({ sku: i.sku as Sku, qty: i.qty, unitPrice: 1000 })),
    total: 1000,
    payment: "card",
    brand: "Lancôme",
  };
}

describe("deriveAffinities", () => {
  it("incluye el tier del cliente", () => {
    const out = deriveAffinities({
      client: makeClient({ tier: "Icon" }),
      purchases: [],
      productBySku: {},
    });
    expect(out[0]).toBe("Cliente Icon · alta gama");
  });

  it("agrega 'Fan de X' cuando hay 2+ unidades de la misma línea", () => {
    const product = makeProduct({ sku: "LC-GEN-50" as Sku, line: "Advanced Génifique" });
    const out = deriveAffinities({
      client: makeClient(),
      purchases: [purchase([{ sku: "LC-GEN-50", qty: 2 }])],
      productBySku: { "LC-GEN-50": product },
    });
    expect(out).toContain("Fan de Advanced Génifique");
  });

  it("agrega categoría predominante (mínimo 2 unidades)", () => {
    const out = deriveAffinities({
      client: makeClient(),
      purchases: [
        purchase([
          { sku: "LC-IDP-50", qty: 1 },
          { sku: "LC-LVE-100", qty: 1 },
        ]),
      ],
      productBySku: {
        "LC-IDP-50": makeProduct({
          sku: "LC-IDP-50" as Sku,
          line: "Idôle",
          attrs: { tipo: "Fragancia", familia: "Floral Chypre" },
        }),
        "LC-LVE-100": makeProduct({
          sku: "LC-LVE-100" as Sku,
          line: "La Vie Est Belle",
          attrs: { tipo: "Fragancia", familia: "Floral Gourmand" },
        }),
      },
    });
    expect(out).toContain("Prefiere fragancia");
  });

  it("agrega concerns del perfil", () => {
    const out = deriveAffinities({
      client: makeClient({
        skin: { type: "Madura", concerns: ["Firmeza", "Líneas finas", "Manchas"], tone: "Medio" },
      }),
      purchases: [],
      productBySku: {},
    });
    expect(out).toContain("Foco: firmeza");
    expect(out).toContain("Foco: líneas finas");
    // Solo top 2.
    expect(out).not.toContain("Foco: manchas");
  });

  it("agrega subtone cuando está", () => {
    const out = deriveAffinities({
      client: makeClient({
        skin: { type: "Mixta", concerns: [], tone: "Medio", subtone: "cálido" },
      }),
      purchases: [],
      productBySku: {},
    });
    expect(out).toContain("Subtono cálido");
  });

  it("agrega ingredientes preferidos", () => {
    const out = deriveAffinities({
      client: makeClient({ preferredIngredients: ["Vitamina C", "Niacinamida"] }),
      purchases: [],
      productBySku: {},
    });
    expect(out).toContain("Le gusta Vitamina C");
    expect(out).toContain("Le gusta Niacinamida");
  });

  it("agrega familia olfativa por fragancias compradas", () => {
    const out = deriveAffinities({
      client: makeClient(),
      purchases: [purchase([{ sku: "LC-IDP-50", qty: 1 }])],
      productBySku: {
        "LC-IDP-50": makeProduct({
          sku: "LC-IDP-50" as Sku,
          line: "Idôle",
          attrs: { tipo: "Fragancia", familia: "Floral Chypre" },
        }),
      },
    });
    expect(out).toContain("Fragancia floral");
  });

  it("preserva afinidades manuales del seed (sin duplicar)", () => {
    const out = deriveAffinities({
      client: makeClient({ affinities: ["Coleccionista de fragancias", "Tier Atelier"] }),
      purchases: [],
      productBySku: {},
    });
    expect(out).toContain("Coleccionista de fragancias");
    // "Tier Atelier" no debe aparecer dos veces.
    expect(out.filter((a) => a === "Tier Atelier")).toHaveLength(1);
  });

  it("cap defensivo de 8 elementos", () => {
    const out = deriveAffinities({
      client: makeClient({
        tier: "Icon",
        skin: { type: "Madura", concerns: ["A", "B", "C"], tone: "M", subtone: "cálido" },
        preferredIngredients: ["X", "Y", "Z"],
        affinities: ["P", "Q", "R", "S", "T"],
      }),
      purchases: [],
      productBySku: {},
    });
    expect(out.length).toBeLessThanOrEqual(8);
  });

  it("devuelve lista vacía cuando no hay datos", () => {
    const out = deriveAffinities({
      client: makeClient({ tier: "Atelier", affinities: [] }),
      purchases: [],
      productBySku: {},
    });
    // Solo el tier Atelier emerge.
    expect(out).toEqual(["Tier Atelier"]);
  });
});

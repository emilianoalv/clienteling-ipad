import { describe, expect, it } from "vitest";
import type { Client, ClientId } from "@/types/client";
import type { Product, Sku } from "@/types/product";
import {
  rankProductsForClient,
  scoreProductCompatibility,
} from "./score-product-compatibility";

function makeClient(overrides: Partial<Client> = {}): Client {
  return {
    id: "cl-test" as ClientId,
    name: "Test Client",
    phone: "+52 55 0000 0000",
    email: "test@example.mx",
    birthday: "1990-01-01",
    city: "CDMX",
    age: 35,
    preferredLang: "es-MX",
    since: "2025-01-01",
    tier: "Atelier",
    brands: ["Lancôme"],
    skin: { type: "Mixta", concerns: ["Hidratación"], tone: "Medio" },
    allergies: [],
    loyalty: { name: "Luxe Circle", tier: "Atelier", points: 0, toNext: 10_000 },
    stats: { ltv: 0, visits: 0, avgTicket: 0, lastPurchase: null },
    affinities: [],
    interests: ["Skincare"],
    routine: "Básica",
    ...overrides,
  };
}

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    sku: "TST-001" as Sku,
    brand: "Lancôme",
    line: "Test Line",
    name: "Test Product",
    size: "50 ml",
    price: 1000,
    stock: {},
    attrs: {},
    howTo: "Apply daily.",
    selling: ["A", "B"],
    lifecycleDays: 100,
    ...overrides,
  };
}

describe("scoreProductCompatibility", () => {
  it("rewards full match: skin + concern + interest", () => {
    const client = makeClient({
      skin: { type: "Mixta", concerns: ["Hidratación", "Luminosidad"], tone: "Medio" },
      interests: ["Skincare"],
    });
    const product = makeProduct({
      attrs: { tipo: "Sérum", piel: ["Mixta"], concerns: ["Hidratación", "Firmeza"] },
    });
    const result = scoreProductCompatibility(client, product);

    // skin direct +3, concern match (Hidratación) +2, interest skincare +1 = 6
    expect(result.score).toBe(6);
    expect(result.reasons.map((r) => r.kind)).toEqual([
      "skin-match",
      "concern-match",
      "interest-match",
    ]);
    expect(result.reasons.every((r) => r.positive)).toBe(true);
  });

  it("zeroes out when an allergy ingredient appears in the product", () => {
    const client = makeClient({ allergies: ["fragancia"] });
    const product = makeProduct({
      name: "Eau de Parfum",
      attrs: { tipo: "Fragancia", familia: "Floral" },
      howTo: "Vaporizar la fragancia sobre la piel.",
    });
    const result = scoreProductCompatibility(client, product);

    // raw: 0 (skin not specified means it's not counted as match)
    //      - 5 allergy = clamped to 0
    expect(result.score).toBe(0);
    expect(result.reasons.some((r) => r.kind === "allergy-conflict")).toBe(true);
  });

  it("penalizes when product targets a different skin type", () => {
    const client = makeClient({
      skin: { type: "Seca", concerns: [], tone: "Claro" },
      interests: [],
    });
    const product = makeProduct({
      attrs: { tipo: "Sérum", piel: ["Grasa"], concerns: ["Luminosidad"] },
    });
    const result = scoreProductCompatibility(client, product);

    // skin mismatch -2 → clamped to 0
    expect(result.score).toBe(0);
    expect(result.reasons[0]?.kind).toBe("skin-mismatch");
    expect(result.reasons[0]?.positive).toBe(false);
  });

  it("returns score 0 with no reasons when product has no relevant attrs", () => {
    const client = makeClient({ interests: [] });
    const product = makeProduct({ attrs: {} });
    const result = scoreProductCompatibility(client, product);

    expect(result.score).toBe(0);
    expect(result.reasons).toHaveLength(0);
  });

  it("ranks products by score descending", () => {
    const client = makeClient({
      skin: { type: "Madura", concerns: ["Firmeza"], tone: "Medio" },
      interests: ["Skincare"],
    });
    const perfect = makeProduct({
      sku: "PERFECT" as Sku,
      attrs: { tipo: "Crema", piel: ["Madura"], concerns: ["Firmeza"] },
    });
    const okay = makeProduct({
      sku: "OKAY" as Sku,
      attrs: { tipo: "Sérum", piel: ["Todas"] },
    });
    const bad = makeProduct({
      sku: "BAD" as Sku,
      attrs: { tipo: "Sérum", piel: ["Grasa"] },
    });
    const ranked = rankProductsForClient(client, [okay, bad, perfect]);

    expect(ranked.map((r) => r.product.sku)).toEqual(["PERFECT", "OKAY", "BAD"]);
    expect(ranked[0]!.score.score).toBeGreaterThan(ranked[1]!.score.score);
    expect(ranked[1]!.score.score).toBeGreaterThan(ranked[2]!.score.score);
  });
});

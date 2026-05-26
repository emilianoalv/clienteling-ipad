import { describe, expect, it } from "vitest";
import type { Client, ClientId } from "@/types/client";
import type { Product, Sku } from "@/types/product";
import type { ProductTech } from "@/types/product-tech";
import type { StoreId } from "@/types/store";
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
    storeId: "st-pol" as StoreId,
    skin: { type: "Mixta", concerns: ["Hidratación"], tone: "Medio" },
    allergies: [],
    loyalty: { name: "Luxe Circle", tier: "Atelier", points: 0, toNext: 10_000 },
    stats: { ltv: 0, visits: 0, avgTicket: 0, lastPurchase: null },
    affinities: [],
    interests: ["Skincare"],
    routine: "Básica",
    createdByBaId: "us-ba-test" as never,
    assignedBaIds: [],
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

function makeTech(overrides: Partial<ProductTech> = {}): ProductTech {
  return {
    keyActives: [{ ingredient: "Test Active", benefit: "Tests stuff" }],
    clinicalResults: [],
    usage: {
      timing: ["AM", "PM"],
      frequency: "Diario",
      slot: "treatment-serum",
      position: 2,
    },
    target: {},
    sensorial: { texture: "test", feel: "test" },
    saleTip: "test tip",
    source: "https://example.com",
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

  it("ignores tech-derived signals when tech is undefined (backward compat)", () => {
    const client = makeClient({
      age: 22,
      routine: "Básica",
      skin: { type: "Mixta", concerns: [], tone: "Medio" },
      interests: [],
    });
    const product = makeProduct({ attrs: { tipo: "Sérum", piel: ["Todas"] } });
    const result = scoreProductCompatibility(client, product);
    // skin +3, no concerns, no interests, no allergies = 3
    expect(result.score).toBe(3);
    expect(result.reasons.map((r) => r.kind)).toEqual(["skin-match"]);
  });

  it("adds age-match bonus when client age within tech range", () => {
    const client = makeClient({
      age: 30,
      skin: { type: "Mixta", concerns: [], tone: "Medio" },
      interests: [],
    });
    const product = makeProduct({ attrs: { tipo: "Sérum", piel: ["Todas"] } });
    const tech = makeTech({ target: { ageMin: 25, ageMax: 45 } });
    const result = scoreProductCompatibility(client, product, tech);
    // skin +3, age in range +1 = 4
    expect(result.score).toBe(4);
    const ageReason = result.reasons.find((r) => r.kind === "age-match");
    expect(ageReason?.positive).toBe(true);
    expect(ageReason?.label).toBe("Edad ideal 25-45");
  });

  it("penalizes when client age below tech ageMin", () => {
    const client = makeClient({
      age: 22,
      skin: { type: "Mixta", concerns: [], tone: "Medio" },
      interests: [],
    });
    const product = makeProduct({ attrs: { tipo: "Sérum", piel: ["Todas"] } });
    const tech = makeTech({ target: { ageMin: 35 } });
    const result = scoreProductCompatibility(client, product, tech);
    // skin +3, age below -1 = 2
    expect(result.score).toBe(2);
    const reason = result.reasons.find((r) => r.kind === "age-mismatch");
    expect(reason?.positive).toBe(false);
    expect(reason?.label).toBe("Pensado para 35+ años");
  });

  it("penalizes when client routine is below required routine level", () => {
    const client = makeClient({
      routine: "Básica",
      skin: { type: "Mixta", concerns: [], tone: "Medio" },
      interests: [],
    });
    const product = makeProduct({ attrs: { tipo: "Sérum", piel: ["Todas"] } });
    const tech = makeTech({ target: { routineLevel: "Avanzada" } });
    const result = scoreProductCompatibility(client, product, tech);
    // skin +3, routine mismatch -1 = 2
    expect(result.score).toBe(2);
    const reason = result.reasons.find((r) => r.kind === "routine-level-mismatch");
    expect(reason?.label).toBe("Requiere rutina avanzada");
  });

  it("penalizes when product timing doesn't overlap with client routineTiming", () => {
    const client = makeClient({
      routineTiming: ["morning"],
      skin: { type: "Mixta", concerns: [], tone: "Medio" },
      interests: [],
    });
    const product = makeProduct({ attrs: { tipo: "Sérum", piel: ["Todas"] } });
    const tech = makeTech({
      usage: {
        timing: ["PM"],
        frequency: "Diario",
        slot: "treatment-serum",
        position: 2,
      },
    });
    const result = scoreProductCompatibility(client, product, tech);
    // skin +3, timing mismatch -1 = 2
    expect(result.score).toBe(2);
    const reason = result.reasons.find((r) => r.kind === "timing-mismatch");
    expect(reason?.label).toBe("Solo se aplica de noche");
  });

  it("flags active-ingredient allergy from tech.keyActives", () => {
    const client = makeClient({
      allergies: ["niacinamida"],
      skin: { type: "Mixta", concerns: [], tone: "Medio" },
      interests: [],
    });
    const product = makeProduct({
      name: "Triple Serum",
      attrs: { tipo: "Sérum", piel: ["Todas"] },
      howTo: "Aplicar diario.",
    });
    const tech = makeTech({
      keyActives: [
        { ingredient: "Vitamina C", benefit: "Antioxidante" },
        { ingredient: "Niacinamida", benefit: "Refuerza barrera" },
      ],
    });
    const result = scoreProductCompatibility(client, product, tech);
    // skin +3, active allergy -5 → clamped to 0
    expect(result.score).toBe(0);
    const reason = result.reasons.find((r) => r.kind === "active-allergy-conflict");
    expect(reason?.label).toBe("Contiene Niacinamida (alergia registrada)");
  });

  it("rankProductsForClient applies tech signals when techs map is provided", () => {
    const client = makeClient({
      age: 26,
      routine: "Básica",
      skin: { type: "Mixta", concerns: [], tone: "Medio" },
      interests: [],
    });
    const youthful = makeProduct({
      sku: "YOUTH" as Sku,
      attrs: { tipo: "Sérum", piel: ["Todas"] },
    });
    const mature = makeProduct({
      sku: "MATURE" as Sku,
      attrs: { tipo: "Sérum", piel: ["Todas"] },
    });

    const techs = new Map<Sku, ProductTech>([
      ["YOUTH" as Sku, makeTech({ target: { ageMin: 18, ageMax: 35 } })],
      ["MATURE" as Sku, makeTech({ target: { ageMin: 45 } })],
    ]);

    const ranked = rankProductsForClient(client, [mature, youthful], techs);
    // YOUTH: skin +3, age in range +1 = 4
    // MATURE: skin +3, age below -1 = 2
    expect(ranked[0]!.product.sku).toBe("YOUTH");
    expect(ranked[0]!.score.score).toBe(4);
    expect(ranked[1]!.score.score).toBe(2);
  });

  it("adds subtone-match bonus when product.attrs.subtone equals client.skin.subtone", () => {
    const client = makeClient({
      skin: { type: "Mixta", concerns: [], tone: "Medio", subtone: "cálido" },
      interests: [],
    });
    const product = makeProduct({
      attrs: { tipo: "Base", piel: ["Todas"], subtone: "cálido" },
    });
    const result = scoreProductCompatibility(client, product);
    // skin +3, subtone match +1 = 4
    expect(result.score).toBe(4);
    const reason = result.reasons.find((r) => r.kind === "subtone-match");
    expect(reason?.positive).toBe(true);
    expect(reason?.label).toBe("Subtono cálido");
  });

  it("does not add subtone bonus when subtones differ or client has none", () => {
    const productCold = makeProduct({
      attrs: { tipo: "Base", piel: ["Todas"], subtone: "frío" },
    });

    // Client without subtone — no boost
    const clientNoSubtone = makeClient({
      skin: { type: "Mixta", concerns: [], tone: "Medio" },
      interests: [],
    });
    expect(scoreProductCompatibility(clientNoSubtone, productCold).score).toBe(3);

    // Client with different subtone — no boost
    const clientWarm = makeClient({
      skin: { type: "Mixta", concerns: [], tone: "Medio", subtone: "cálido" },
      interests: [],
    });
    expect(scoreProductCompatibility(clientWarm, productCold).score).toBe(3);
  });

  it("boosts products that fill an empty slot in client.routineSteps", () => {
    const client = makeClient({
      routineSteps: ["cleanser", "moisturizer", "spf"],
      skin: { type: "Mixta", concerns: [], tone: "Medio" },
      interests: [],
    });
    const product = makeProduct({ attrs: { tipo: "Sérum", piel: ["Todas"] } });
    // Serum slot is missing from client routine → +1 gap-fill
    const tech = makeTech({
      usage: { timing: ["AM", "PM"], frequency: "Diario", slot: "treatment-serum", position: 2 },
    });
    const result = scoreProductCompatibility(client, product, tech);
    // skin +3, routine gap fill +1 = 4
    expect(result.score).toBe(4);
    const reason = result.reasons.find((r) => r.kind === "routine-gap-fill");
    expect(reason?.positive).toBe(true);
    expect(reason?.label).toBe("Llena un hueco: sérum");
  });

  it("does not boost gap-fill when slot is already in client routineSteps", () => {
    const client = makeClient({
      routineSteps: ["cleanser", "serum", "moisturizer"],
      skin: { type: "Mixta", concerns: [], tone: "Medio" },
      interests: [],
    });
    const product = makeProduct({ attrs: { tipo: "Sérum", piel: ["Todas"] } });
    const tech = makeTech({
      usage: { timing: ["AM", "PM"], frequency: "Diario", slot: "treatment-serum", position: 2 },
    });
    const result = scoreProductCompatibility(client, product, tech);
    // skin +3, no gap fill = 3
    expect(result.score).toBe(3);
    expect(result.reasons.some((r) => r.kind === "routine-gap-fill")).toBe(false);
  });

  it("adds preferred-ingredient bonus when keyActive matches client.preferredIngredients", () => {
    const client = makeClient({
      preferredIngredients: ["Vitamina C"],
      skin: { type: "Mixta", concerns: [], tone: "Medio" },
      interests: [],
    });
    const product = makeProduct({ attrs: { tipo: "Sérum", piel: ["Todas"] } });
    const tech = makeTech({
      keyActives: [
        { ingredient: "Vitamina C", benefit: "Antioxidante" },
        { ingredient: "Ácido Ferúlico", benefit: "Cofactor" },
      ],
    });
    const result = scoreProductCompatibility(client, product, tech);
    // skin +3, preferred ingredient +1 = 4
    expect(result.score).toBe(4);
    const reason = result.reasons.find((r) => r.kind === "preferred-ingredient");
    expect(reason?.label).toBe("Te gusta: Vitamina C");
  });

  it("penalizes products with avoided ingredient (-3, softer than allergy)", () => {
    const client = makeClient({
      avoidedIngredients: ["Fragancia"],
      skin: { type: "Mixta", concerns: [], tone: "Medio" },
      interests: [],
    });
    const product = makeProduct({ attrs: { tipo: "Sérum", piel: ["Todas"] } });
    const tech = makeTech({
      keyActives: [
        { ingredient: "Vitamina C", benefit: "Antioxidante" },
        { ingredient: "Fragancia floral", benefit: "Aroma" },
      ],
    });
    const result = scoreProductCompatibility(client, product, tech);
    // skin +3, avoided -3 = 0
    expect(result.score).toBe(0);
    const reason = result.reasons.find((r) => r.kind === "avoided-ingredient");
    expect(reason?.positive).toBe(false);
    expect(reason?.label).toBe("Contiene Fragancia floral (prefieres evitar)");
  });

  it("adds line-affinity bonus when product.line matches a client affinity", () => {
    const client = makeClient({
      affinities: ["Génifique"],
      skin: { type: "Mixta", concerns: [], tone: "Medio" },
      interests: [],
    });
    const product = makeProduct({
      line: "Advanced Génifique",
      attrs: { tipo: "Sérum", piel: ["Todas"] },
    });
    const result = scoreProductCompatibility(client, product);
    // skin +3, line-affinity +2 = 5
    expect(result.score).toBe(5);
    const reason = result.reasons.find((r) => r.kind === "line-affinity");
    expect(reason?.label).toBe("Ya disfrutas Génifique");
  });

  it("does not double-boost when client has multiple matching affinities", () => {
    const client = makeClient({
      affinities: ["Génifique", "Génifique Sérum"],
      skin: { type: "Mixta", concerns: [], tone: "Medio" },
      interests: [],
    });
    const product = makeProduct({
      line: "Advanced Génifique",
      attrs: { tipo: "Sérum", piel: ["Todas"] },
    });
    const result = scoreProductCompatibility(client, product);
    // skin +3, line-affinity +2 (uno solo) = 5
    expect(result.score).toBe(5);
    expect(result.reasons.filter((r) => r.kind === "line-affinity")).toHaveLength(1);
  });

  it("adds fragrance-family bonus when product familia overlaps with client interests", () => {
    const client = makeClient({
      interests: ["Floral", "Oriental"],
      skin: { type: "Mixta", concerns: [], tone: "Medio" },
    });
    const product = makeProduct({
      line: "Idôle",
      attrs: { tipo: "Fragancia", familia: "Floral Chypre" },
    });
    const result = scoreProductCompatibility(client, product);
    // sin skin (fragancia no tiene piel), interest "Floral" no está en
    // productInterestCategories → no aplica interest-match general.
    // Pero fragrance-family +2 = 2
    expect(result.score).toBe(2);
    const reason = result.reasons.find((r) => r.kind === "fragrance-family-match");
    expect(reason?.label).toBe("Familia floral que te interesa");
  });

  it("normalizes accents and gender so 'amaderado' matches 'Amaderada'", () => {
    const client = makeClient({
      interests: ["Amaderada"],
      skin: { type: "Mixta", concerns: [], tone: "Medio" },
    });
    const product = makeProduct({
      attrs: { tipo: "Fragancia", familia: "Floral amaderado" },
    });
    const result = scoreProductCompatibility(client, product);
    // fragrance-family +2 = 2
    expect(result.score).toBe(2);
    expect(result.reasons.some((r) => r.kind === "fragrance-family-match")).toBe(true);
  });

  it("does not add fragrance-family bonus when no interest overlaps", () => {
    const client = makeClient({
      interests: ["Cítrica"],
      skin: { type: "Mixta", concerns: [], tone: "Medio" },
    });
    const product = makeProduct({
      attrs: { tipo: "Fragancia", familia: "Floral Gourmand" },
    });
    const result = scoreProductCompatibility(client, product);
    expect(result.score).toBe(0);
    expect(result.reasons.some((r) => r.kind === "fragrance-family-match")).toBe(false);
  });

  it("adds gender-match bonus when product.attrs.gender equals client.gender", () => {
    const client = makeClient({
      gender: "Femenino",
      skin: { type: "Mixta", concerns: [], tone: "Medio" },
      interests: [],
    });
    const product = makeProduct({
      attrs: { tipo: "Labial", gender: "Femenino" },
    });
    const result = scoreProductCompatibility(client, product);
    // gender +1 = 1
    expect(result.score).toBe(1);
    expect(result.reasons.some((r) => r.kind === "gender-match")).toBe(true);
  });

  it("gender Unisex matches any client gender as soft positive", () => {
    const client = makeClient({
      gender: "Masculino",
      skin: { type: "Mixta", concerns: [], tone: "Medio" },
      interests: [],
    });
    const product = makeProduct({
      attrs: { tipo: "Fragancia", gender: "Unisex" },
    });
    const result = scoreProductCompatibility(client, product);
    expect(result.reasons.some((r) => r.kind === "gender-match")).toBe(true);
  });

  it("gender mismatch does not penalize (soft positive only)", () => {
    const client = makeClient({
      gender: "Masculino",
      skin: { type: "Mixta", concerns: [], tone: "Medio" },
      interests: [],
    });
    const product = makeProduct({
      attrs: { tipo: "Fragancia", gender: "Femenino" },
    });
    const result = scoreProductCompatibility(client, product);
    expect(result.score).toBe(0);
    expect(result.reasons.some((r) => r.kind === "gender-match")).toBe(false);
  });

  it("lifestyle products (lipstick) stack multiple new signals to rank competitively", () => {
    const client = makeClient({
      gender: "Femenino",
      affinities: ["L'Absolu Rouge"],
      skin: { type: "Mixta", concerns: ["Hidratación"], tone: "Medio" },
      interests: ["Maquillaje"],
    });
    const lipstick = makeProduct({
      line: "L'Absolu Rouge",
      attrs: {
        tipo: "Labial",
        concerns: ["Hidratación", "Color duradero"],
        gender: "Femenino",
      },
    });
    const result = scoreProductCompatibility(client, lipstick);
    // concern Hidratación +2, interest Maquillaje +1, line-affinity +2,
    // gender +1 = 6 (antes solo daba interest +1 = 1)
    expect(result.score).toBe(6);
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

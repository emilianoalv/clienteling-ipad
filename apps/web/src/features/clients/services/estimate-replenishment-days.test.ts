import { describe, expect, it } from "vitest";
import type { Product, Sku } from "@/types/product";
import type { ProductTech } from "@/types/product-tech";
import { estimateReplenishmentDays } from "./estimate-replenishment-days";

function makeProduct(lifecycleDays: number): Product {
  return {
    sku: "TEST-1" as Sku,
    brand: "Lancôme",
    line: "Test",
    name: "Test",
    size: "50 ml",
    price: 1000,
    stock: {},
    attrs: { tipo: "Sérum" },
    howTo: "",
    selling: [],
    lifecycleDays,
  };
}

function makeTech(frequency: string): ProductTech {
  return {
    keyActives: [],
    clinicalResults: [],
    usage: { timing: ["AM", "PM"], frequency, slot: "treatment-serum", position: 2 },
    target: {},
    sensorial: { texture: "test", feel: "test" },
    saleTip: "",
    source: "",
  };
}

describe("estimateReplenishmentDays", () => {
  it("usa lifecycleDays cuando qty=1 y sin tech", () => {
    expect(estimateReplenishmentDays({ product: makeProduct(90) })).toBe(90);
  });

  it("multiplica por qty", () => {
    expect(estimateReplenishmentDays({ product: makeProduct(90), qty: 2 })).toBe(180);
    expect(estimateReplenishmentDays({ product: makeProduct(90), qty: 3 })).toBe(270);
  });

  it("trata qty < 1 como 1 (defensivo)", () => {
    expect(estimateReplenishmentDays({ product: makeProduct(90), qty: 0 })).toBe(90);
  });

  it("aplica ×2.5 cuando la frecuencia es '2 veces por semana'", () => {
    expect(
      estimateReplenishmentDays({
        product: makeProduct(90),
        tech: makeTech("2 veces por semana"),
      }),
    ).toBe(225);
  });

  it("aplica ×4 cuando es 'Según necesidad'", () => {
    expect(
      estimateReplenishmentDays({
        product: makeProduct(90),
        tech: makeTech("Según necesidad"),
      }),
    ).toBe(360);
  });

  it("no ajusta cuando la frecuencia es 'Diario'", () => {
    expect(
      estimateReplenishmentDays({
        product: makeProduct(90),
        tech: makeTech("Diario"),
      }),
    ).toBe(90);
  });

  it("combina qty + frecuencia", () => {
    // 90 base × 2 qty × 2.5 freq = 450
    expect(
      estimateReplenishmentDays({
        product: makeProduct(90),
        qty: 2,
        tech: makeTech("2 veces por semana"),
      }),
    ).toBe(450);
  });
});

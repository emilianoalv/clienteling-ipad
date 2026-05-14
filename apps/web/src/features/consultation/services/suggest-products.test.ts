import { describe, expect, it } from "vitest";
import type { Product, Sku } from "@/types/product";
import type { StoreId } from "@/types/store";
import { suggestProducts } from "./suggest-products";

function make(
  sku: string,
  brand: "Lancôme" | "YSL",
  concerns: readonly string[],
  piel: readonly string[] = ["Todas"],
): Product {
  return {
    sku: sku as Sku,
    brand,
    line: sku,
    name: sku,
    size: "50 ml",
    price: 1000,
    stock: {} as Record<StoreId, number>,
    attrs: { tipo: "Sérum", concerns, piel },
    howTo: "",
    selling: [],
    lifecycleDays: 90,
  };
}

describe("suggestProducts", () => {
  it("returns nothing when neither concerns nor skin type match", () => {
    const out = suggestProducts(
      [make("A", "Lancôme", ["Hidratación"], ["Madura"])],
      { skinType: "Mixta", concerns: ["Acné adulto"] },
    );
    // "Acné adulto" maps to "Cobertura" — not on product, and piel "Madura" != "Mixta"
    expect(out).toHaveLength(0);
  });

  it("falls back to skin-match-only via piel: Todas", () => {
    const out = suggestProducts(
      [make("A", "Lancôme", ["Hidratación"], ["Todas"])],
      { skinType: "Mixta", concerns: ["Acné adulto"] },
    );
    // piel "Todas" earns 1 point even without concern overlap
    expect(out.map((p) => p.sku)).toEqual(["A"]);
  });

  it("ranks higher when both concerns and skin type match", () => {
    const matchBoth = make("BOTH", "Lancôme", ["Luminosidad"], ["Mixta"]);
    const matchOnly = make("ONLY", "Lancôme", ["Luminosidad"], ["Madura"]);
    const out = suggestProducts([matchOnly, matchBoth], {
      skinType: "Mixta",
      concerns: ["Luminosidad"],
    });
    expect(out[0]?.sku).toBe("BOTH");
  });

  it("respects brand scope", () => {
    const a = make("A", "Lancôme", ["Luminosidad"]);
    const b = make("B", "YSL", ["Luminosidad"]);
    const out = suggestProducts([a, b], {
      skinType: "Mixta",
      concerns: ["Luminosidad"],
      brands: ["YSL"],
    });
    expect(out.map((p) => p.sku)).toEqual(["B"]);
  });

  it("respects the limit", () => {
    const items = Array.from({ length: 10 }, (_, i) =>
      make(`P${i}`, "Lancôme", ["Luminosidad"]),
    );
    const out = suggestProducts(items, { skinType: "Mixta", concerns: ["Luminosidad"] }, 3);
    expect(out).toHaveLength(3);
  });
});

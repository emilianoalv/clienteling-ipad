import { describe, expect, it } from "vitest";
import { mapTipoToCategory } from "./category-mapping";

describe("mapTipoToCategory", () => {
  it("Skincare: Sérum, Crema, Limpiador", () => {
    expect(mapTipoToCategory("Sérum")).toBe("Skincare");
    expect(mapTipoToCategory("Crema")).toBe("Skincare");
    expect(mapTipoToCategory("Limpiador")).toBe("Skincare");
  });

  it("Makeup: Base, Labial, Corrector", () => {
    expect(mapTipoToCategory("Base")).toBe("Makeup");
    expect(mapTipoToCategory("Labial")).toBe("Makeup");
    expect(mapTipoToCategory("Corrector")).toBe("Makeup");
  });

  it("Fragancia: Fragancia, Eau de Parfum, Parfum", () => {
    expect(mapTipoToCategory("Fragancia")).toBe("Fragancia");
    expect(mapTipoToCategory("Eau de Parfum")).toBe("Fragancia");
    expect(mapTipoToCategory("Parfum")).toBe("Fragancia");
  });

  it("tipo desconocido → null", () => {
    expect(mapTipoToCategory("Esmalte")).toBeNull();
    expect(mapTipoToCategory("Ambiental")).toBeNull();
  });

  it("undefined / null / empty → null", () => {
    expect(mapTipoToCategory(undefined)).toBeNull();
    expect(mapTipoToCategory(null)).toBeNull();
    expect(mapTipoToCategory("")).toBeNull();
  });
});

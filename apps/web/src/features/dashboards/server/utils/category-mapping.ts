import "server-only";

/**
 * Maps the granular `Product.attrs.tipo` (Sérum, Crema, Labial, …) to the
 * macro-category the BRD uses for reports/dashboards (Skincare / Makeup /
 * Fragancia — RF-05, RF-44).
 *
 * The table only covers `tipo` values that appear in the current product
 * seed. If a new product type is added without updating this map, it lands
 * in `Unmapped` (see `getSalesByCategory`).
 */
export type MacroCategory = "Skincare" | "Makeup" | "Fragancia";

const TIPO_TO_CATEGORY: Record<string, MacroCategory> = {
  // Skincare
  Sérum: "Skincare",
  Crema: "Skincare",
  Limpiador: "Skincare",
  Mascarilla: "Skincare",
  Tónico: "Skincare",
  Aceite: "Skincare",
  // Makeup
  Base: "Makeup",
  Labial: "Makeup",
  Corrector: "Makeup",
  Sombra: "Makeup",
  Rímel: "Makeup",
  Rubor: "Makeup",
  Iluminador: "Makeup",
  // Fragancia
  Fragancia: "Fragancia",
  "Eau de Parfum": "Fragancia",
  "Eau de Toilette": "Fragancia",
  Parfum: "Fragancia",
};

export function mapTipoToCategory(
  tipo: string | undefined | null,
): MacroCategory | null {
  if (!tipo) return null;
  return TIPO_TO_CATEGORY[tipo] ?? null;
}

import "server-only";
import type { BrandId } from "@/types/brand";
import type { Product, Sku } from "@/types/product";
import type { StoreId } from "@/types/store";

const ST_POLANCO = "st-polanco" as StoreId;
const ST_SANTA_FE = "st-santa-fe" as StoreId;
const ST_PALACIO = "st-palacio-polanco" as StoreId;

const SEED: Product[] = [
  {
    sku: "LC-GEN-50" as Sku,
    brand: "Lancôme",
    line: "Advanced Génifique",
    name: "Serum activador de juventud",
    size: "50 ml",
    price: 2_890,
    stock: { [ST_POLANCO]: 14, [ST_PALACIO]: 6, [ST_SANTA_FE]: 9 } as Product["stock"],
    attrs: { tipo: "Sérum", piel: ["Todas"], concerns: ["Luminosidad", "Firmeza"], vegano: false },
    howTo: "Aplicar mañana y noche sobre rostro y cuello limpios, antes de la crema.",
    selling: ["Tecnología probiótica", "77% más luminosa en 7 días", "Éxito de ventas global"],
    lifecycleDays: 90,
  },
  {
    sku: "LC-ABS-50" as Sku,
    brand: "Lancôme",
    line: "Absolue",
    name: "Crema suave regeneradora",
    size: "60 ml",
    price: 7_450,
    stock: { [ST_POLANCO]: 4, [ST_PALACIO]: 2, [ST_SANTA_FE]: 1 } as Product["stock"],
    attrs: { tipo: "Crema", piel: ["Madura"], concerns: ["Arrugas", "Firmeza"], vegano: false },
    howTo: "Aplicar en rostro y cuello cada mañana, con masaje ascendente.",
    selling: ["Rosa Centifolia de Grasse", "Texture couture", "Formulación premium"],
    lifecycleDays: 100,
  },
  {
    sku: "LC-TID-30" as Sku,
    brand: "Lancôme",
    line: "Teint Idole Ultra Wear",
    name: "Base de maquillaje 24H",
    size: "30 ml",
    price: 1_250,
    stock: { [ST_POLANCO]: 22, [ST_PALACIO]: 18, [ST_SANTA_FE]: 14 } as Product["stock"],
    attrs: { tipo: "Base", piel: ["Todas"], concerns: ["Cobertura"], vegano: true },
    howTo: "Aplicar con brocha o esponja húmeda desde el centro del rostro.",
    selling: ["24 horas de duración", "45 tonos", "Acabado natural luminoso"],
    lifecycleDays: 120,
  },
  {
    sku: "LC-LVE-100" as Sku,
    brand: "Lancôme",
    line: "La Vie Est Belle",
    name: "Eau de Parfum",
    size: "100 ml",
    price: 3_890,
    stock: { [ST_POLANCO]: 9, [ST_PALACIO]: 7, [ST_SANTA_FE]: 3 } as Product["stock"],
    attrs: { tipo: "Fragancia", familia: "Floral gourmand" },
    howTo: "Aplicar en puntos de pulso: cuello, muñecas, detrás de las orejas.",
    selling: ["Iris · Jazmín · Azahar", "Ícono de la casa", "Frasco sonrisa Baccarat"],
    lifecycleDays: 180,
  },
  {
    sku: "YS-LIB-90" as Sku,
    brand: "YSL",
    line: "Libre",
    name: "Le Parfum",
    size: "90 ml",
    price: 4_120,
    stock: { [ST_POLANCO]: 6, [ST_PALACIO]: 10, [ST_SANTA_FE]: 8 } as Product["stock"],
    attrs: { tipo: "Fragancia", familia: "Floral amaderado" },
    howTo: "Vaporizar sobre la piel a 15 cm.",
    selling: ["Lavanda de Francia", "Azahar de Marruecos", "Ícono contemporáneo"],
    lifecycleDays: 180,
  },
  {
    sku: "YS-RPC-01" as Sku,
    brand: "YSL",
    line: "Rouge Pur Couture",
    name: "Labial The Bold",
    size: "2.8 g",
    price: 950,
    stock: { [ST_POLANCO]: 30, [ST_PALACIO]: 24, [ST_SANTA_FE]: 20 } as Product["stock"],
    attrs: { tipo: "Labial" },
    howTo: "Aplicar directo del tubo; para mayor precisión usar pincel.",
    selling: ["Pigmentación saturada", "Confort 8 horas", "Tubo icónico YSL"],
    lifecycleDays: 240,
  },
  {
    sku: "YS-TCL-02" as Sku,
    brand: "YSL",
    line: "Touche Éclat",
    name: "Iluminador corrector",
    size: "2.5 ml",
    price: 1_180,
    stock: { [ST_POLANCO]: 18, [ST_PALACIO]: 12, [ST_SANTA_FE]: 6 } as Product["stock"],
    attrs: { tipo: "Corrector" },
    howTo: "Aplicar en ángulos del rostro: ojeras, entrecejo, arco de cupido.",
    selling: ["40 millones vendidos mundialmente", "Ilumina sin cobertura", "Icono absoluto"],
    lifecycleDays: 150,
  },
  {
    sku: "YS-OR-100" as Sku,
    brand: "YSL",
    line: "Or Rouge",
    name: "Sérum iluminador",
    size: "50 ml",
    price: 6_490,
    stock: { [ST_POLANCO]: 2, [ST_PALACIO]: 3, [ST_SANTA_FE]: 0 } as Product["stock"],
    attrs: { tipo: "Sérum", piel: ["Todas"], concerns: ["Luminosidad", "Arrugas"] },
    howTo: "Mañana y noche antes del tratamiento.",
    selling: ["Azafrán Premium Sativus", "Bioactivos concentrados", "Alta gama YSL"],
    lifecycleDays: 100,
  },
];

const PRODUCTS = new Map<Sku, Product>(SEED.map((p) => [p.sku, p]));

export interface ProductListFilter {
  query?: string;
  brand?: BrandId;
  brands?: readonly BrandId[];
  /** Product `attrs.tipo` (e.g. "Sérum", "Labial"). */
  category?: string;
}

export interface ProductRepository {
  list(filter?: ProductListFilter): Promise<Product[]>;
  findBySku(sku: Sku): Promise<Product | null>;
}

export const productRepository: ProductRepository = {
  async list(filter = {}) {
    const all = Array.from(PRODUCTS.values());
    const scope = filter.brands;
    const query = filter.query?.trim().toLowerCase();
    return all.filter((p) => {
      if (filter.brand && p.brand !== filter.brand) return false;
      if (scope && scope.length && !scope.includes(p.brand)) return false;
      if (filter.category && p.attrs.tipo !== filter.category) return false;
      if (!query) return true;
      const haystack = `${p.sku} ${p.line} ${p.name} ${p.brand}`.toLowerCase();
      return haystack.includes(query);
    });
  },

  async findBySku(sku) {
    return PRODUCTS.get(sku) ?? null;
  },
};

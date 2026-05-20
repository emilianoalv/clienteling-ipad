import "server-only";
import type { BrandId } from "@/types/brand";
import type { Product, Sku } from "@/types/product";
import type { StoreId } from "@/types/store";

const ST_POLANCO = "st-polanco" as StoreId;
const ST_SANTA_FE = "st-santa-fe" as StoreId;
const ST_PALACIO = "st-palacio-polanco" as StoreId;

/**
 * Catálogo Lancôme: datos reales verificados contra lancome.com.mx (mayo 2026)
 * y cruzados con retailers autorizados MX (Palacio de Hierro, Sephora MX,
 * Sears, Amazon MX). Precios en MXN al precio normal de marca.
 *
 * Catálogo YSL: pendiente de pasada de verificación; datos heredados.
 */
const SEED: Product[] = [
  // ── Lancôme · Skincare · Sérums ──────────────────────────────────────────
  {
    sku: "LC-GEN-50" as Sku,
    brand: "Lancôme",
    line: "Advanced Génifique",
    name: "Serum activador de juventud",
    size: "50 ml",
    price: 2_250,
    stock: { [ST_POLANCO]: 14, [ST_PALACIO]: 6, [ST_SANTA_FE]: 9 } as Product["stock"],
    attrs: {
      tipo: "Sérum",
      piel: ["Todas"],
      concerns: ["Luminosidad", "Firmeza", "Líneas finas"],
      vegano: false,
    },
    howTo: "Aplicar 5-6 gotas mañana y noche con palmaditas sobre rostro y cuello limpios, antes de la crema.",
    selling: [
      "Prebiótico Bífidus al 10%",
      "Refuerza el microbioma cutáneo",
      "Piel más luminosa en 7 días",
    ],
    lifecycleDays: 90,
    sampleSku: "LC-GEN-7" as Sku,
  },
  {
    sku: "LC-REN-50" as Sku,
    brand: "Lancôme",
    line: "Rénergie H.C.F. Triple Serum",
    name: "Suero antiedad de alto rendimiento",
    size: "50 ml",
    price: 3_250,
    stock: { [ST_POLANCO]: 8, [ST_PALACIO]: 5, [ST_SANTA_FE]: 4 } as Product["stock"],
    attrs: {
      tipo: "Sérum",
      piel: ["Madura", "Todas"],
      concerns: ["Arrugas", "Manchas", "Firmeza", "Luminosidad"],
      vegano: false,
    },
    howTo: "Aplicar mañana y noche sobre piel limpia antes de la crema; agitar para activar la cámara de ácido ferúlico.",
    selling: [
      "Vitamina C + Niacinamida + Ácido Ferúlico",
      "Ácido hialurónico de nueva generación",
      "Piel más joven en 2 semanas",
    ],
    lifecycleDays: 90,
    sampleSku: "LC-REN-5" as Sku,
  },

  // ── Lancôme · Skincare · Cremas ──────────────────────────────────────────
  {
    sku: "LC-ABS-50" as Sku,
    brand: "Lancôme",
    line: "Absolue",
    name: "Soft Cream — crema revitalizante",
    size: "60 ml",
    price: 6_700,
    stock: { [ST_POLANCO]: 4, [ST_PALACIO]: 2, [ST_SANTA_FE]: 1 } as Product["stock"],
    attrs: {
      tipo: "Crema",
      piel: ["Madura", "Seca"],
      concerns: ["Arrugas", "Firmeza", "Luminosidad"],
      vegano: false,
    },
    howTo: "Aplicar mañana y noche sobre rostro y cuello, masajeando con movimientos ascendentes.",
    selling: [
      "Extractos Grand Rose de Grasse",
      "96% percibe contornos más definidos",
      "24 h de hidratación luminosa",
    ],
    lifecycleDays: 100,
    sampleSku: "LC-ABS-5" as Sku,
  },
  {
    sku: "LC-AEC-20" as Sku,
    brand: "Lancôme",
    line: "Absolue",
    name: "Revitalizing Eye Cream — contorno antiedad",
    size: "20 ml",
    price: 2_860,
    stock: { [ST_POLANCO]: 6, [ST_PALACIO]: 3, [ST_SANTA_FE]: 2 } as Product["stock"],
    attrs: {
      tipo: "Crema",
      piel: ["Madura"],
      concerns: ["Arrugas", "Patas de gallo", "Bolsas"],
      vegano: false,
    },
    howTo: "Aplicar mañana y noche con palmaditas alrededor del ojo usando el dedo anular.",
    selling: [
      "Mezcla exclusiva de rosas de Grasse",
      "Reduce líneas, patas de gallo y bolsas",
      "Textura sedosa de rápida absorción",
    ],
    lifecycleDays: 90,
    sampleSku: "LC-AEC-3" as Sku,
  },
  {
    sku: "LC-HZN-50" as Sku,
    brand: "Lancôme",
    line: "Hydra Zen",
    name: "Gel Cream — hidratación calmante",
    size: "50 ml",
    price: 1_550,
    stock: { [ST_POLANCO]: 18, [ST_PALACIO]: 12, [ST_SANTA_FE]: 10 } as Product["stock"],
    attrs: {
      tipo: "Crema",
      piel: ["Mixta", "Sensible", "Todas"],
      concerns: ["Deshidratación", "Sensibilidad", "Rojeces"],
      vegano: false,
    },
    howTo: "Aplicar mañana y/o noche sobre rostro limpio; ideal para piel normal a mixta.",
    selling: [
      "Rosa Centifolia + ácido hialurónico 10x",
      "72 h de hidratación",
      "Calma la piel en 1 segundo",
    ],
    lifecycleDays: 75,
    sampleSku: "LC-HZN-7" as Sku,
  },

  // ── Lancôme · Maquillaje · Bases & Corrector ─────────────────────────────
  {
    sku: "LC-TID-30" as Sku,
    brand: "Lancôme",
    line: "Teint Idole Ultra Wear",
    name: "Foundation 24H — base cobertura completa",
    size: "30 ml",
    price: 1_400,
    stock: { [ST_POLANCO]: 22, [ST_PALACIO]: 18, [ST_SANTA_FE]: 14 } as Product["stock"],
    attrs: {
      tipo: "Base",
      piel: ["Todas"],
      concerns: ["Cobertura", "Imperfecciones", "Tono desigual"],
      vegano: false,
      subtone: "neutro",
    },
    howTo: "Aplicar con esponja o brocha desde el centro hacia afuera; cobertura construible.",
    selling: [
      "24 h de uso, cobertura completa",
      "81% serum de cuidado de la piel",
      "Ácido hialurónico, acabado matte natural",
    ],
    lifecycleDays: 120,
  },
  {
    sku: "LC-TCG-30" as Sku,
    brand: "Lancôme",
    line: "Teint Idole Ultra Wear",
    name: "Care & Glow — base infusionada con serum",
    size: "30 ml",
    price: 1_400,
    stock: { [ST_POLANCO]: 16, [ST_PALACIO]: 11, [ST_SANTA_FE]: 9 } as Product["stock"],
    attrs: {
      tipo: "Base",
      piel: ["Seca", "Todas"],
      concerns: ["Hidratación", "Luminosidad", "Tono desigual"],
      vegano: false,
      subtone: "cálido",
    },
    howTo: "Aplicar 2-3 gotas con dedos o brocha sobre rostro hidratado; agitar antes de usar.",
    selling: [
      "86% serum hidratante",
      "Ácido hialurónico + ácido mandélico",
      "Acabado luminoso natural, SPF 27",
    ],
    lifecycleDays: 120,
  },
  {
    sku: "LC-TIC-13" as Sku,
    brand: "Lancôme",
    line: "Teint Idole Ultra Wear",
    name: "All Over Concealer — corrector líquido 24H",
    size: "13 ml",
    price: 870,
    stock: { [ST_POLANCO]: 24, [ST_PALACIO]: 18, [ST_SANTA_FE]: 14 } as Product["stock"],
    attrs: {
      tipo: "Corrector",
      piel: ["Todas"],
      concerns: ["Ojeras", "Imperfecciones", "Tono desigual"],
      vegano: false,
      subtone: "neutro",
    },
    howTo: "Aplicar bajo el ojo y sobre imperfecciones; difuminar con esponja o dedos.",
    selling: [
      "24 h de duración, acabado matte",
      "Alta cobertura construible",
      "Pigmentos puros, efecto filtro",
    ],
    lifecycleDays: 150,
  },

  // ── Lancôme · Maquillaje · Labios ────────────────────────────────────────
  {
    sku: "LC-LAR-34" as Sku,
    brand: "Lancôme",
    line: "L'Absolu Rouge",
    name: "Cream — labial cremoso de larga duración",
    size: "3.4 g",
    price: 590,
    stock: { [ST_POLANCO]: 28, [ST_PALACIO]: 22, [ST_SANTA_FE]: 18 } as Product["stock"],
    attrs: { tipo: "Labial", vegano: false },
    howTo: "Aplicar directo del bullet sobre los labios; estuche recargable con refill.",
    selling: [
      "30% bálsamo de rosa hidratante",
      "Hasta 18 h de confort",
      "Ácido hialurónico + aceite prensado en frío",
    ],
    lifecycleDays: 240,
  },

  // ── Lancôme · Fragancias ─────────────────────────────────────────────────
  {
    sku: "LC-IDP-50" as Sku,
    brand: "Lancôme",
    line: "Idôle",
    name: "Le Parfum — Eau de Parfum",
    size: "50 ml",
    price: 2_400,
    stock: { [ST_POLANCO]: 11, [ST_PALACIO]: 8, [ST_SANTA_FE]: 5 } as Product["stock"],
    attrs: { tipo: "Fragancia", familia: "Floral Chypre" },
    howTo: "Vaporizar en puntos de pulso: muñecas, cuello y detrás de las orejas.",
    selling: [
      "Rosa Radical: 4 rosas en un solo acorde",
      "Jazmín indio absoluto",
      "Botella ultradelgada recargable",
    ],
    lifecycleDays: 180,
    sampleSku: "LC-IDP-1" as Sku,
  },
  {
    sku: "LC-LVE-100" as Sku,
    brand: "Lancôme",
    line: "La Vie Est Belle",
    name: "Eau de Parfum",
    size: "100 ml",
    price: 3_890,
    stock: { [ST_POLANCO]: 9, [ST_PALACIO]: 7, [ST_SANTA_FE]: 3 } as Product["stock"],
    attrs: { tipo: "Fragancia", familia: "Floral Gourmand" },
    howTo: "Vaporizar en puntos de pulso; intensidad media-alta, ideal para día y noche.",
    selling: [
      "Iris Pallida + vainilla cálida",
      "Jazmín Sambac y flor de azahar",
      "La fragancia más vendida de Lancôme",
    ],
    lifecycleDays: 180,
    sampleSku: "LC-LVE-1" as Sku,
  },
  {
    sku: "LC-LIA-100" as Sku,
    brand: "Lancôme",
    line: "La Vie Est Belle",
    name: "Iris Absolu — Eau de Parfum",
    size: "100 ml",
    price: 3_820,
    stock: { [ST_POLANCO]: 5, [ST_PALACIO]: 4, [ST_SANTA_FE]: 2 } as Product["stock"],
    attrs: { tipo: "Fragancia", familia: "Floral Frutal Gourmand" },
    howTo: "Vaporizar en puntos de pulso; perfecto para ocasiones especiales.",
    selling: [
      "Iris Pallida 10x más concentrado",
      "Corazón floral adictivo",
      "Lanzamiento premium 2023",
    ],
    lifecycleDays: 200,
  },
  {
    sku: "LC-TRE-100" as Sku,
    brand: "Lancôme",
    line: "Trésor",
    name: "Eau de Parfum — fragancia icónica desde 1990",
    size: "100 ml",
    price: 3_600,
    stock: { [ST_POLANCO]: 7, [ST_PALACIO]: 6, [ST_SANTA_FE]: 4 } as Product["stock"],
    attrs: { tipo: "Fragancia", familia: "Floral Oriental" },
    howTo: "Vaporizar en puntos de pulso; aroma envolvente para ocasiones románticas.",
    selling: [
      "Rosa, durazno y lila en salida",
      "Corazón de iris y jazmín",
      "Base de ámbar y sándalo",
    ],
    lifecycleDays: 200,
    sampleSku: "LC-TRE-1" as Sku,
  },
  {
    sku: "LC-MIR-100" as Sku,
    brand: "Lancôme",
    line: "Miracle",
    name: "Eau de Parfum — fragancia floral luminosa",
    size: "100 ml",
    price: 2_015,
    stock: { [ST_POLANCO]: 8, [ST_PALACIO]: 5, [ST_SANTA_FE]: 3 } as Product["stock"],
    attrs: { tipo: "Fragancia", familia: "Floral" },
    howTo: "Vaporizar en puntos de pulso; ideal para día por su carácter luminoso.",
    selling: [
      "Lichi y fresia en salida",
      "Magnolia, jengibre y jazmín en corazón",
      "Almizcle y ámbar en fondo",
    ],
    lifecycleDays: 200,
    sampleSku: "LC-MIR-1" as Sku,
  },

  // ── YSL (datos heredados — pendiente verificación oficial) ───────────────
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

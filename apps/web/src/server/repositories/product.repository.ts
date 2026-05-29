import "server-only";
import type { BrandId } from "@/types/brand";
import type { Product, Sku } from "@/types/product";
import type { StoreId } from "@/types/store";
import { persistent } from "./_persist";

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
    image: "/products/lc-gen-50.jpg",
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
    image: "/products/lc-ren-50.jpg",
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
    image: "/products/lc-abs-50.jpg",
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
    image: "/products/lc-aec-20.jpg",
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
    image: "/products/lc-hzn-50.jpg",
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
    image: "/products/lc-tid-30.jpg",
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
    image: "/products/lc-tcg-30.jpg",
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
    image: "/products/lc-tic-13.jpg",
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
    image: "/products/lc-lar-34.jpg",
    brand: "Lancôme",
    line: "L'Absolu Rouge",
    name: "Cream — labial cremoso de larga duración",
    size: "3.4 g",
    price: 590,
    stock: { [ST_POLANCO]: 28, [ST_PALACIO]: 22, [ST_SANTA_FE]: 18 } as Product["stock"],
    attrs: {
      tipo: "Labial",
      vegano: false,
      concerns: ["Hidratación", "Color duradero"],
      gender: "Femenino",
    },
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
    image: "/products/lc-idp-50.jpg",
    brand: "Lancôme",
    line: "Idôle",
    name: "Le Parfum — Eau de Parfum",
    size: "50 ml",
    price: 2_400,
    stock: { [ST_POLANCO]: 11, [ST_PALACIO]: 8, [ST_SANTA_FE]: 5 } as Product["stock"],
    attrs: { tipo: "Fragancia", familia: "Floral Chypre", gender: "Femenino" },
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
    image: "/products/lc-lve-100.jpg",
    brand: "Lancôme",
    line: "La Vie Est Belle",
    name: "Eau de Parfum",
    size: "100 ml",
    price: 3_890,
    stock: { [ST_POLANCO]: 9, [ST_PALACIO]: 7, [ST_SANTA_FE]: 3 } as Product["stock"],
    attrs: { tipo: "Fragancia", familia: "Floral Gourmand", gender: "Femenino" },
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
    image: "/products/lc-lia-100.jpg",
    brand: "Lancôme",
    line: "La Vie Est Belle",
    name: "Iris Absolu — Eau de Parfum",
    size: "100 ml",
    price: 3_820,
    stock: { [ST_POLANCO]: 5, [ST_PALACIO]: 4, [ST_SANTA_FE]: 2 } as Product["stock"],
    attrs: { tipo: "Fragancia", familia: "Floral Frutal Gourmand", gender: "Femenino" },
    howTo: "Vaporizar en puntos de pulso; perfecto para ocasiones especiales.",
    selling: [
      "Iris Pallida 10x más concentrado",
      "Corazón floral adictivo",
      "Lanzamiento premium 2023",
    ],
    lifecycleDays: 200,
    sampleSku: "LC-LIA-1" as Sku,
  },
  {
    sku: "LC-TRE-100" as Sku,
    image: "/products/lc-tre-100.jpg",
    brand: "Lancôme",
    line: "Trésor",
    name: "Eau de Parfum — fragancia icónica desde 1990",
    size: "100 ml",
    price: 3_600,
    stock: { [ST_POLANCO]: 7, [ST_PALACIO]: 6, [ST_SANTA_FE]: 4 } as Product["stock"],
    attrs: { tipo: "Fragancia", familia: "Floral Oriental", gender: "Femenino" },
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
    image: "/products/lc-mir-100.jpg",
    brand: "Lancôme",
    line: "Miracle",
    name: "Eau de Parfum — fragancia floral luminosa",
    size: "100 ml",
    price: 2_015,
    stock: { [ST_POLANCO]: 8, [ST_PALACIO]: 5, [ST_SANTA_FE]: 3 } as Product["stock"],
    attrs: { tipo: "Fragancia", familia: "Floral", gender: "Femenino" },
    howTo: "Vaporizar en puntos de pulso; ideal para día por su carácter luminoso.",
    selling: [
      "Lichi y fresia en salida",
      "Magnolia, jengibre y jazmín en corazón",
      "Almizcle y ámbar en fondo",
    ],
    lifecycleDays: 200,
    sampleSku: "LC-MIR-1" as Sku,
  },

  // ── YSL · Fragancias ─────────────────────────────────────────────────────
  // Mix balanceado femenino + masculino, alineado con catálogo YSL Beauty MX
  // 2026. Familias normalizadas para que el matcher de fragancia del scorer
  // las cruce con los intereses del cliente (Aromática para masculinas).
  {
    sku: "YS-LIB-90" as Sku,
    image: "/products/ys-lib-90.jpg",
    brand: "YSL",
    line: "Libre",
    name: "Eau de Parfum",
    size: "90 ml",
    price: 4_120,
    stock: { [ST_POLANCO]: 6, [ST_PALACIO]: 10, [ST_SANTA_FE]: 8 } as Product["stock"],
    attrs: { tipo: "Fragancia", familia: "Floral Amaderada", gender: "Femenino" },
    howTo: "Vaporizar en puntos de pulso: muñecas, cuello y detrás de las orejas.",
    selling: [
      "Lavanda de Francia + azahar de Marruecos",
      "Ícono contemporáneo femenino",
      "Frasco recargable, oro 24K",
    ],
    lifecycleDays: 240,
    sampleSku: "YS-LIB-1" as Sku,
  },
  {
    sku: "YS-BO-50" as Sku,
    image: "/products/ys-bo-50.jpg",
    brand: "YSL",
    line: "Black Opium",
    name: "Eau de Parfum",
    size: "50 ml",
    price: 2_650,
    stock: { [ST_POLANCO]: 12, [ST_PALACIO]: 9, [ST_SANTA_FE]: 7 } as Product["stock"],
    attrs: { tipo: "Fragancia", familia: "Gourmand Oriental", gender: "Femenino" },
    howTo: "Vaporizar en puntos de pulso; ideal de tarde a noche por su intensidad.",
    selling: [
      "Café negro adictivo + vainilla blanca",
      "Flor de azahar y jazmín sambac",
      "El éxito femenino YSL desde 2014",
    ],
    lifecycleDays: 180,
    sampleSku: "YS-BO-1" as Sku,
  },
  {
    sku: "YS-Y-60" as Sku,
    image: "/products/ys-y-60.jpg",
    brand: "YSL",
    line: "Y",
    name: "Eau de Parfum",
    size: "60 ml",
    price: 2_950,
    stock: { [ST_POLANCO]: 9, [ST_PALACIO]: 7, [ST_SANTA_FE]: 5 } as Product["stock"],
    attrs: { tipo: "Fragancia", familia: "Aromática Amaderada", gender: "Masculino" },
    howTo: "Vaporizar en cuello y muñecas; perfil sofisticado día a noche.",
    selling: [
      "Salvia + bergamota fresca",
      "Acordes amaderados intensos",
      "El espíritu YSL hombre contemporáneo",
    ],
    lifecycleDays: 180,
    sampleSku: "YS-Y-1" as Sku,
  },
  {
    sku: "YS-MYS-60" as Sku,
    image: "/products/ys-mys-60.jpg",
    brand: "YSL",
    line: "MYSLF",
    name: "Eau de Parfum",
    size: "60 ml",
    price: 3_120,
    stock: { [ST_POLANCO]: 8, [ST_PALACIO]: 6, [ST_SANTA_FE]: 4 } as Product["stock"],
    attrs: { tipo: "Fragancia", familia: "Aromática Floral", gender: "Masculino" },
    howTo: "Vaporizar en puntos de pulso; firma masculina moderna y versátil.",
    selling: [
      "Azahar fresco + pera jugosa",
      "Pachulí cashmeran amaderado",
      "Lanzamiento masculino 2023",
    ],
    lifecycleDays: 180,
    sampleSku: "YS-MYS-1" as Sku,
  },

  // ── YSL · Maquillaje · Labios ────────────────────────────────────────────
  {
    sku: "YS-RPC-01" as Sku,
    image: "/products/ys-rpc-01.jpg",
    brand: "YSL",
    line: "Rouge Pur Couture",
    name: "Labial The Bold",
    size: "2.8 g",
    price: 950,
    stock: { [ST_POLANCO]: 30, [ST_PALACIO]: 24, [ST_SANTA_FE]: 20 } as Product["stock"],
    attrs: {
      tipo: "Labial",
      concerns: ["Color duradero", "Pigmentación intensa"],
      gender: "Femenino",
    },
    howTo: "Aplicar directo del tubo; para mayor precisión usar pincel.",
    selling: ["Pigmentación saturada", "Confort 8 horas", "Tubo icónico YSL"],
    lifecycleDays: 240,
  },
  {
    sku: "YS-TC-01" as Sku,
    image: "/products/ys-tc-01.jpg",
    brand: "YSL",
    line: "Tatouage Couture",
    name: "Velvet Cream — labial mate líquido",
    size: "6 ml",
    price: 990,
    stock: { [ST_POLANCO]: 22, [ST_PALACIO]: 17, [ST_SANTA_FE]: 13 } as Product["stock"],
    attrs: {
      tipo: "Labial",
      concerns: ["Color duradero", "Acabado mate", "Pigmentación intensa"],
      gender: "Femenino",
    },
    howTo: "Aplicar con el aplicador difuminador del centro hacia afuera; dejar secar 60 s.",
    selling: ["Acabado matte aterciopelado", "Cobertura full en una pasada", "Larga duración 16 h"],
    lifecycleDays: 200,
  },
  {
    sku: "YS-LS-01" as Sku,
    image: "/products/ys-ls-01.jpg",
    brand: "YSL",
    line: "Loveshine",
    name: "Candy Glaze — gloss con cuidado",
    size: "4.7 ml",
    price: 870,
    stock: { [ST_POLANCO]: 26, [ST_PALACIO]: 20, [ST_SANTA_FE]: 16 } as Product["stock"],
    attrs: {
      tipo: "Labial",
      concerns: ["Hidratación", "Volumen visible", "Brillo"],
      gender: "Femenino",
    },
    howTo: "Aplicar generoso sobre los labios; recargable.",
    selling: ["Aceite de jojoba hidratante", "Acabado vinilo espejado", "11 tonos brillantes"],
    lifecycleDays: 180,
  },

  // ── YSL · Maquillaje · Rostro ────────────────────────────────────────────
  {
    sku: "YS-AHF-25" as Sku,
    image: "/products/ys-ahf-25.jpg",
    brand: "YSL",
    line: "All Hours",
    name: "Foundation 24H — base larga duración",
    size: "25 ml",
    price: 1_280,
    stock: { [ST_POLANCO]: 18, [ST_PALACIO]: 14, [ST_SANTA_FE]: 11 } as Product["stock"],
    attrs: {
      tipo: "Base",
      piel: ["Todas"],
      concerns: ["Cobertura", "Imperfecciones", "Larga duración"],
      vegano: false,
      subtone: "neutro",
    },
    howTo: "Aplicar con esponja húmeda o brocha; cobertura construible mate.",
    selling: ["24 h sin transferencia", "Cobertura full mate natural", "SPF 30"],
    lifecycleDays: 120,
  },
  {
    sku: "YS-NPR-30" as Sku,
    image: "/products/ys-npr-30.jpg",
    brand: "YSL",
    line: "Nu Bare Look Tint",
    name: "Base ligera infusionada con serum",
    size: "30 ml",
    price: 1_120,
    stock: { [ST_POLANCO]: 14, [ST_PALACIO]: 10, [ST_SANTA_FE]: 8 } as Product["stock"],
    attrs: {
      tipo: "Base",
      piel: ["Mixta", "Seca", "Todas"],
      concerns: ["Hidratación", "Luminosidad", "Cobertura ligera"],
      vegano: false,
      subtone: "cálido",
    },
    howTo: "Aplicar con dedos o brocha; acabado glow piel desnuda con velo de color.",
    selling: ["94% ingredientes naturales", "Ácido hialurónico + niacinamida", "Acabado glow saludable"],
    lifecycleDays: 100,
  },
  {
    sku: "YS-TCL-02" as Sku,
    image: "/products/ys-tcl-02.jpg",
    brand: "YSL",
    line: "Touche Éclat",
    name: "Iluminador corrector",
    size: "2.5 ml",
    price: 1_180,
    stock: { [ST_POLANCO]: 18, [ST_PALACIO]: 12, [ST_SANTA_FE]: 6 } as Product["stock"],
    attrs: {
      tipo: "Corrector",
      piel: ["Todas"],
      concerns: ["Ojeras", "Luminosidad", "Tono desigual"],
      subtone: "neutro",
    },
    howTo: "Aplicar en ángulos del rostro: ojeras, entrecejo, arco de cupido.",
    selling: ["40 millones vendidos mundialmente", "Ilumina sin cobertura", "Icono absoluto"],
    lifecycleDays: 150,
  },

  // ── YSL · Maquillaje · Ojos ──────────────────────────────────────────────
  {
    sku: "YS-LC-01" as Sku,
    image: "/products/ys-lc-01.jpg",
    brand: "YSL",
    line: "Lash Clash",
    name: "Volumizing Mascara — máscara de volumen extremo",
    size: "9 ml",
    price: 940,
    stock: { [ST_POLANCO]: 25, [ST_PALACIO]: 19, [ST_SANTA_FE]: 14 } as Product["stock"],
    attrs: {
      tipo: "Máscara",
      concerns: ["Volumen", "Larga duración", "Ojos / Pestañas"],
      gender: "Femenino",
    },
    howTo: "Aplicar en zigzag desde la raíz hacia las puntas; capas progresivas.",
    selling: ["Volumen extremo 24 h", "Cepillo XL exclusivo", "Sin grumos, no transfiere"],
    lifecycleDays: 90,
  },

  // ── YSL · Skincare ───────────────────────────────────────────────────────
  // Foco en líneas Or Rouge (premium) y Pure Shots (acción dirigida) — el
  // skincare YSL es más selectivo que el de Lancôme, no busca cobertura
  // completa sino solución a concerns específicos.
  {
    sku: "YS-OR-100" as Sku,
    image: "/products/ys-or-100.jpg",
    brand: "YSL",
    line: "Or Rouge",
    name: "Sérum iluminador con azafrán",
    size: "50 ml",
    price: 6_490,
    stock: { [ST_POLANCO]: 2, [ST_PALACIO]: 3, [ST_SANTA_FE]: 1 } as Product["stock"],
    attrs: {
      tipo: "Sérum",
      piel: ["Madura", "Todas"],
      concerns: ["Luminosidad", "Arrugas", "Firmeza"],
      vegano: false,
    },
    howTo: "Aplicar 5 gotas mañana y noche sobre rostro limpio, antes de la crema.",
    selling: ["Azafrán Premium Sativus", "Bioactivos concentrados", "Alta gama YSL"],
    lifecycleDays: 100,
    sampleSku: "YS-OR-5" as Sku,
  },
  {
    sku: "YS-PSE-15" as Sku,
    image: "/products/ys-pse-15.jpg",
    brand: "YSL",
    line: "Pure Shots",
    name: "Y-Shape Targeted Eye — contorno antiedad",
    size: "15 ml",
    price: 2_280,
    stock: { [ST_POLANCO]: 8, [ST_PALACIO]: 6, [ST_SANTA_FE]: 4 } as Product["stock"],
    attrs: {
      tipo: "Crema",
      piel: ["Madura", "Todas"],
      concerns: ["Ojeras", "Patas de gallo", "Firmeza", "Bolsas"],
      vegano: false,
    },
    howTo: "Aplicar con palmaditas alrededor del ojo, mañana y noche; aplicador masaje incluido.",
    selling: [
      "Aplicador metálico drenante",
      "Cafeína + ácido hialurónico",
      "Reduce bolsas en 1 semana",
    ],
    lifecycleDays: 90,
    sampleSku: "YS-PSE-3" as Sku,
  },
];

// v2 invalida v1 — antes era un Map plano sin write ops. Ahora el repo
// soporta create/update/delete para que el Admin gestione el catálogo
// desde la UI (RF-55 + RF-17) sin redeploy.
const PRODUCTS = persistent(
  "__clienteling.products.v2",
  () => new Map<Sku, Product>(SEED.map((p) => [p.sku, p])),
);

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
  create(input: Product): Promise<Product>;
  update(sku: Sku, patch: Partial<Omit<Product, "sku">>): Promise<Product | null>;
  delete(sku: Sku): Promise<boolean>;
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

  async create(input) {
    PRODUCTS.set(input.sku, input);
    return input;
  },

  async update(sku, patch) {
    const current = PRODUCTS.get(sku);
    if (!current) return null;
    // attrs es un sub-objeto; el caller pasa attrs completo si quiere
    // editar campos sueltos (la UI hace el merge antes). El resto del
    // patch hace shallow merge directo.
    const next: Product = { ...current, ...patch, sku };
    PRODUCTS.set(sku, next);
    return next;
  },

  async delete(sku) {
    return PRODUCTS.delete(sku);
  },
};

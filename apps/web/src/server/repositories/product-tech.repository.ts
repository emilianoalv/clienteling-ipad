import "server-only";
import type { Sku } from "@/types/product";
import type { ProductTech } from "@/types/product-tech";

/**
 * Ficha técnica seed para los 14 productos Lancôme reales.
 *
 * Cada entrada fue verificada contra fuentes oficiales:
 * - lancome-usa.com (skincare clínicos con n y %)
 * - lancome.com.mx (claims y presentación MX)
 * - fragrantica.com (notas olfativas de fragancias)
 *
 * Reglas de poblado:
 * - keyActives: solo activos reales documentados; concentration solo cuando
 *   la marca la publica explícitamente ("Hialurónico 10x" en Hydra Zen sí,
 *   "Hialurónico" en Génifique sin %)
 * - clinicalResults: solo claims oficiales con n y período; mejor 2 reales
 *   que 5 inventados
 * - layerWith: solo SKUs del catálogo actual, combinaciones lógicas reales
 *   (sérum → crema, día → noche)
 *
 * YSL pendiente. `find(sku)` retorna null para productos sin ficha.
 */
const TECH: Record<string, ProductTech> = {
  // ── LC-GEN-50 · Advanced Génifique ──────────────────────────────────────
  "LC-GEN-50": {
    keyActives: [
      { ingredient: "Bífidus Prebiótico", concentration: "10%", benefit: "Refuerza el microbioma cutáneo" },
      { ingredient: "Ácido Hialurónico", benefit: "Hidratación inmediata y duradera" },
      { ingredient: "Vitamina Cg (3%)", concentration: "3%", benefit: "Antioxidante y luminosidad" },
    ],
    clinicalResults: [
      { claim: "Piel más luminosa", period: "7 días", sample: "consumidoras" },
      { claim: "Hidratación demostrada por 72 h", period: "72 h", sample: "24 mujeres" },
      { claim: "Mejora visible en líneas finas", period: "8 semanas", sample: "34 mujeres" },
    ],
    usage: {
      timing: ["AM", "PM"],
      frequency: "Diario",
      slot: "treatment-serum",
      position: 2,
    },
    target: {
      ageMin: 25,
      skinTypes: ["Todas", "Mixta", "Seca", "Grasa", "Sensible"],
      concerns: ["Luminosidad", "Firmeza", "Líneas finas", "Textura desigual"],
      routineLevel: "Básica",
    },
    sensorial: {
      texture: "Suero acuoso, casi como agua tratada",
      scent: "Imperceptible, prácticamente sin fragancia",
      feel: "Absorbe en segundos, no deja film ni pegajoso",
    },
    saleTip: "El sérum #1 ventas globales de Lancôme. Punto de entrada perfecto al universo Lancôme: lo siente luminoso desde la primera semana sin pedirle a la clienta una rutina elaborada. Aplicar después de limpieza, antes de cualquier crema.",
    cautions: [],
    layerWith: ["LC-ABS-50" as Sku, "LC-AEC-20" as Sku, "LC-HZN-50" as Sku],
    source: "https://www.lancome-usa.com/skincare/face-serum/advanced-genifique-face-serum/1000302.html",
  },

  // ── LC-REN-50 · Rénergie H.C.F. Triple Serum ────────────────────────────
  "LC-REN-50": {
    keyActives: [
      { ingredient: "Vitamina C", benefit: "Antioxidante, ilumina y unifica tono" },
      { ingredient: "Niacinamida", benefit: "Refuerza barrera y reduce manchas" },
      { ingredient: "Ácido Ferúlico", benefit: "Potencia antioxidantes en cámara separada" },
      { ingredient: "Ácido Hialurónico", benefit: "Plumping y rellenado de líneas" },
    ],
    clinicalResults: [
      { claim: "Piel más lisa +30.1%", period: "8 semanas", sample: "45 mujeres" },
      { claim: "Líneas finas reducidas -13.8%", period: "8 semanas", sample: "45 mujeres" },
      { claim: "Manchas menos intensas -15%", period: "8 semanas", sample: "45 mujeres" },
      { claim: "95% siente piel re-plumped", period: "8 semanas", sample: "58 mujeres" },
    ],
    usage: {
      timing: ["AM", "PM"],
      frequency: "Diario, agitar antes de aplicar",
      slot: "treatment-serum",
      position: 2,
    },
    target: {
      ageMin: 35,
      skinTypes: ["Todas", "Madura"],
      concerns: ["Arrugas", "Manchas", "Firmeza", "Luminosidad"],
      routineLevel: "Intermedia",
    },
    sensorial: {
      texture: "Sérum fluido con cámara de ácido ferúlico activable al agitar",
      scent: "Ligero cítrico fresco",
      feel: "Acabado seco, no pegajoso, listo para maquillaje",
    },
    saleTip: "El antiedad multitarea — vitamina C + niacinamida + ferúlico es la trinidad dermatológica probada. Para clienta 35+ que ya tiene rutina con sérum básico y quiere subir un escalón sin saltar a retinol.",
    cautions: [
      "Usar SPF durante el día — la vitamina C potencia fotosensibilidad",
      "Si combina con retinol, alternar AM (este) / PM (retinol)",
    ],
    layerWith: ["LC-ABS-50" as Sku, "LC-AEC-20" as Sku],
    source: "https://www.lancome-usa.com/skincare/face-serum/renergie-h.c.f.-triple-serum/3614272860377.html",
  },

  // ── LC-ABS-50 · Absolue Soft Cream ──────────────────────────────────────
  "LC-ABS-50": {
    keyActives: [
      { ingredient: "Grand Rose Extracts", benefit: "Mezcla exclusiva de rosas de Grasse" },
      { ingredient: "Pro-Xylane™", benefit: "Patente Lancôme — restaura matriz dérmica" },
      { ingredient: "Manteca de Karité", benefit: "Nutrición profunda y confort" },
      { ingredient: "Aceite de Meadowfoam", benefit: "Sella hidratación, antioxidante" },
    ],
    clinicalResults: [
      { claim: "Luminosidad mejorada +20%", period: "4 semanas", sample: "47 mujeres" },
      { claim: "Piel más lisa +19%", period: "4 semanas", sample: "47 mujeres" },
      { claim: "Líneas finas reducidas -13%", period: "4 semanas", sample: "47 mujeres" },
      { claim: "95% siente piel más suave", period: "4 semanas", sample: "117 mujeres" },
    ],
    usage: {
      timing: ["AM", "PM"],
      frequency: "Diario, mañana y noche",
      slot: "treatment-cream",
      position: 4,
    },
    target: {
      ageMin: 45,
      skinTypes: ["Madura", "Seca"],
      concerns: ["Arrugas", "Firmeza", "Luminosidad", "Pérdida de densidad"],
      routineLevel: "Básica",
    },
    sensorial: {
      texture: "Crema couture rica pero soft, derrite al contacto",
      scent: "Floral elegante de rosa de Grasse",
      feel: "Capa untuosa que se asienta sedosa, no graso",
    },
    saleTip: "El antiedad premium para clienta Atelier/Icon que busca sentir lujo en la textura. Pro-Xylane es la molécula patentada Lancôme — no la encuentra en ninguna otra marca. Ideal complementa con Génifique como sérum.",
    cautions: [],
    layerWith: ["LC-GEN-50" as Sku, "LC-REN-50" as Sku, "LC-AEC-20" as Sku],
    source: "https://www.lancome-usa.com/skincare/absolue-soft-cream-moisturizer/00651-LAC.html",
  },

  // ── LC-AEC-20 · Absolue Revitalizing Eye Cream ──────────────────────────
  "LC-AEC-20": {
    keyActives: [
      { ingredient: "Grand Rose Extracts", benefit: "Mezcla exclusiva rosas de Grasse" },
      { ingredient: "Pro-Xylane™", benefit: "Patente Lancôme — rellena área periocular" },
      { ingredient: "Manteca de Karité", benefit: "Nutrición intensa" },
      { ingredient: "Extracto de Linaza", benefit: "Calma y suaviza contorno delicado" },
    ],
    clinicalResults: [
      { claim: "Bolsas reducidas -31.3%", period: "4 semanas", sample: "41 mujeres" },
      { claim: "Arrugas bajo el ojo -15.9%", period: "4 semanas", sample: "41 mujeres" },
      { claim: "Patas de gallo -10.7%", period: "4 semanas", sample: "41 mujeres" },
      { claim: "77% percibe piel más radiante", period: "4 semanas", sample: "52 mujeres" },
    ],
    usage: {
      timing: ["AM", "PM"],
      frequency: "Diario, mañana y noche con dedo anular",
      slot: "eye-cream",
      position: 3,
    },
    target: {
      ageMin: 35,
      skinTypes: ["Madura", "Seca"],
      concerns: ["Arrugas", "Patas de gallo", "Bolsas", "Ojeras"],
      routineLevel: "Intermedia",
    },
    sensorial: {
      texture: "Crema rica que se transforma en velo sedoso",
      scent: "Floral discreto",
      feel: "Hidrata intensamente sin migrar al párpado",
    },
    saleTip: "Único contorno premium Lancôme con Pro-Xylane Y Grand Rose. Targets las 3 quejas más comunes — bolsas, líneas y ojeras — con data clínica respaldando cada una. Ideal para clienta que dice 'me veo cansada'.",
    cautions: ["Aplicar con dedo anular y golpecitos suaves, nunca frotar el contorno"],
    layerWith: ["LC-ABS-50" as Sku, "LC-GEN-50" as Sku, "LC-REN-50" as Sku],
    source: "https://www.lancome-usa.com/absolue-eye-cream/LAN323.html",
  },

  // ── LC-HZN-50 · Hydra Zen Gel Cream ─────────────────────────────────────
  "LC-HZN-50": {
    keyActives: [
      { ingredient: "Rosa Centifolia de Grasse", benefit: "Agua de rosa extraída con CO2" },
      { ingredient: "Ácido Hialurónico 10x", concentration: "10x concentrado", benefit: "Hidratación inmediata" },
      { ingredient: "Bisabolol", benefit: "Calma rojeces y sensibilidad" },
    ],
    clinicalResults: [
      { claim: "Hidratación 72 h", period: "72 h", sample: "28 mujeres" },
      { claim: "+52% hidratación a los 30 min", period: "30 min", sample: "24 mujeres" },
      { claim: "Rojez visible -22%", period: "4 semanas", sample: "79 mujeres" },
      { claim: "97% percibe piel hidratada", period: "4 semanas", sample: "170 mujeres" },
    ],
    usage: {
      timing: ["AM", "PM"],
      frequency: "Diario, ideal para piel mixta a grasa",
      slot: "treatment-cream",
      position: 4,
    },
    target: {
      ageMin: 18,
      skinTypes: ["Mixta", "Sensible", "Todas", "Grasa"],
      concerns: ["Deshidratación", "Sensibilidad", "Rojeces", "Estrés cutáneo"],
      routineLevel: "Básica",
    },
    sensorial: {
      texture: "Gel-crema acuoso, fórmula 97% origen natural",
      scent: "Rosa centifolia suave",
      feel: "Funde al instante, deja piel hidratada sin brillo",
    },
    saleTip: "La opción 'todoterreno' del catálogo. Para clienta joven o quien viene con piel reactiva — calma en 1 segundo. Capa la rosa de Grasse exclusiva sin sacarle el bolsillo a la clienta que aún no quiere Absolue.",
    cautions: [],
    layerWith: ["LC-GEN-50" as Sku, "LC-REN-50" as Sku],
    source: "https://www.lancome-usa.com/skincare/by-category/day-creams/hydra-zen-gel-cream/00689-LAC.html",
  },

  // ── LC-TID-30 · Teint Idole Ultra Wear Foundation 24H ───────────────────
  "LC-TID-30": {
    keyActives: [
      { ingredient: "Serum cuidado de la piel", concentration: "81%", benefit: "Hidratación durante uso prolongado" },
      { ingredient: "Ácido Hialurónico", benefit: "Hidratación visible" },
      { ingredient: "Vitamina E", benefit: "Antioxidante, protege piel" },
    ],
    clinicalResults: [
      { claim: "9 de 10 mujeres: tono más uniforme", period: "3 semanas", sample: "consumidoras" },
      { claim: "Hasta 24 h de uso sin caking", period: "24 h" },
    ],
    usage: {
      timing: ["AM"],
      frequency: "Según ocasión, con esponja o brocha",
      slot: "foundation",
      position: 6,
    },
    target: {
      ageMin: 18,
      skinTypes: ["Todas", "Sensible"],
      concerns: ["Tono desigual", "Imperfecciones", "Cobertura completa"],
    },
    sensorial: {
      texture: "Fluido ligero, sin sensación pesada",
      finish: "Matte natural respirable",
      feel: "Transfer-resistant, sweat-resistant, no se asienta en líneas",
    },
    saleTip: "La base con la cobertura más larga del portafolio Lancôme. 45 tonos disponibles — para clienta que pide 'ni se note pero que dure todo el día'. Ideal evento, boda, viaje.",
    cautions: ["Agitar antes de aplicar para activar pigmentos"],
    layerWith: ["LC-TIC-13" as Sku],
    source: "https://www.lancome-usa.com/makeup/face-makeup/foundation/teint-idole-ultra-wear-foundation/00716-LAC.html",
  },

  // ── LC-TCG-30 · Teint Idole Ultra Wear Care & Glow ──────────────────────
  "LC-TCG-30": {
    keyActives: [
      { ingredient: "Serum hidratante", concentration: "82%", benefit: "Base con cuidado de la piel" },
      { ingredient: "Ácido Hialurónico", benefit: "Hidratación visible" },
      { ingredient: "Ácido Mandélico", benefit: "Exfolia suavemente y unifica" },
      { ingredient: "SPF 27", benefit: "Protección amplio espectro" },
    ],
    clinicalResults: [],
    usage: {
      timing: ["AM"],
      frequency: "Según ocasión, sobre piel hidratada",
      slot: "foundation",
      position: 6,
    },
    target: {
      ageMin: 18,
      skinTypes: ["Seca", "Todas", "Madura"],
      concerns: ["Deshidratación", "Luminosidad", "Tono desigual"],
    },
    sensorial: {
      texture: "Sérum fluido de cobertura construible",
      finish: "Glow saludable, jamás brillo grasoso",
      feel: "Hidrata mientras se usa, no marca textura ni poros",
    },
    saleTip: "Para clienta que dice 'odio sentir base'. Es la base más cercana a la piel desnuda iluminada. SPF 27 incorporado quita un paso de la rutina mañanera. Ideal para piel madura o seca que con base matte se ve apagada.",
    cautions: [
      "El SPF 27 es base de protección, complementar con SPF dedicado si exposición prolongada",
    ],
    layerWith: ["LC-TIC-13" as Sku, "LC-HZN-50" as Sku],
    source: "https://www.lancome-usa.com/makeup/face-makeup/foundation/teint-idole-ultra-wear-care-and-glow-serum-foundation/00641-LAC.html",
  },

  // ── LC-TIC-13 · Teint Idole All Over Concealer ──────────────────────────
  "LC-TIC-13": {
    keyActives: [
      { ingredient: "Semilla de Moringa", benefit: "Protege contra agresores urbanos" },
      { ingredient: "Extracto de Rosa", benefit: "Retiene hidratación" },
      { ingredient: "Extracto de Nenúfar", benefit: "Calma piel y rojeces" },
    ],
    clinicalResults: [
      { claim: "Hasta 24 h de hidratación al usar", period: "24 h" },
    ],
    usage: {
      timing: ["AM"],
      frequency: "Según necesidad, sobre o sin base",
      slot: "concealer",
      position: 6,
    },
    target: {
      ageMin: 18,
      skinTypes: ["Todas", "Seca", "Sensible"],
      concerns: ["Ojeras", "Imperfecciones", "Manchas", "Rojeces"],
    },
    sensorial: {
      texture: "Líquido cremoso pero ligero",
      finish: "Matte natural alta cobertura",
      feel: "No se asienta en líneas finas ni se cuartea, no carga",
    },
    saleTip: "Sin parabenos, sin sulfatos, sin alérgenos comunes — apto para clienta de piel sensible. Cubre y a la vez hidrata el contorno de ojo (el área más seca del rostro), que es donde otros correctores fallan.",
    cautions: [],
    layerWith: ["LC-TID-30" as Sku, "LC-TCG-30" as Sku],
    source: "https://www.lancome-usa.com/makeup/face-makeup/concealers/teint-idole-ultra-wear-all-over-full-coverage-concealer/00422-LAC.html",
  },

  // ── LC-LAR-34 · L'Absolu Rouge Cream ────────────────────────────────────
  "LC-LAR-34": {
    keyActives: [
      { ingredient: "Bálsamo de Rosa", concentration: "30%", benefit: "Extracto de 3 rosas hand-picked" },
      { ingredient: "Ácido Hialurónico", benefit: "Hidratación del labio" },
    ],
    clinicalResults: [
      { claim: "Hasta 18 h de confort", period: "18 h" },
      { claim: "8 h de hidratación", period: "8 h" },
    ],
    usage: {
      timing: ["AM", "PM"],
      frequency: "Según ocasión, retocar a libre demanda",
      slot: "lip",
      position: 6,
    },
    target: {
      ageMin: 18,
      skinTypes: ["Todas"],
      concerns: [],
    },
    sensorial: {
      texture: "Ultra-cremosa, glide al deslizar",
      finish: "Color luminoso smudge-resistant",
      feel: "Confort hidratado, no marca líneas ni 'feathering'",
    },
    saleTip: "El labial cremoso recargable de Lancôme. 30% bálsamo de rosa lo hace tan suave como un bálsamo pero con saturación de labial. Ofrecer refill ($630) cuando termine: ahorro 30% + sustentabilidad.",
    cautions: [],
    layerWith: [],
    source: "https://www.lancome-usa.com/makeup/lip-makeup/lipstick/labsolu-rouge-cream-lipstick/00531-LAC.html",
  },

  // ── LC-IDP-50 · Idôle Le Parfum ─────────────────────────────────────────
  "LC-IDP-50": {
    keyActives: [
      { ingredient: "Pera", benefit: "Nota de salida — jugosidad fresca" },
      { ingredient: "Bergamota · Pimienta Rosa", benefit: "Salida luminosa con un toque picante" },
      { ingredient: "Rosa Isparta de Turquía", benefit: "Corazón — exclusiva sustentable Lancôme" },
      { ingredient: "Jazmín de la India · Rosa Centifolia", benefit: "Corazón floral multifacético" },
      { ingredient: "Almizcle Blanco · Vainilla", benefit: "Fondo limpio y luminoso" },
      { ingredient: "Pachulí · Cedro", benefit: "Fondo amaderado contemporáneo" },
    ],
    clinicalResults: [],
    usage: {
      timing: ["AM", "PM"],
      frequency: "Según ocasión, en puntos de pulso",
      slot: "fragrance",
      position: 6,
    },
    target: {
      ageMin: 18,
      skinTypes: ["Todas"],
      concerns: [],
    },
    sensorial: {
      texture: "Eau de parfum, concentración media-alta",
      scent: "Floral chypre moderno con efecto 'clean & glow'",
      feel: "Estela sutil, duración media; perfecto día y noche",
    },
    saleTip: "Co-creado por 3 perfumistas mujeres — único en el portafolio. Rosa Isparta sustentable de Turquía es exclusiva Lancôme. Botella ultradelgada recargable, ideal para clienta que viaja. Más limpio que La Vie Est Belle.",
    cautions: [
      "Aplicar en piel limpia para mejor desarrollo — evitar puntos con perfume previo",
    ],
    layerWith: [],
    source: "https://www.fragrantica.com/perfume/Lancome/Idole-55795.html",
  },

  // ── LC-LVE-100 · La Vie Est Belle EDP ───────────────────────────────────
  "LC-LVE-100": {
    keyActives: [
      { ingredient: "Pera · Grosella Negra", benefit: "Salida frutal jugosa" },
      { ingredient: "Iris Pallida de Francia", benefit: "Corazón — sustentable, polvoso elegante" },
      { ingredient: "Jazmín Sambac · Flor de Azahar", benefit: "Corazón floral envolvente" },
      { ingredient: "Vainilla Madagascar · Pralina", benefit: "Fondo gourmand cálido" },
      { ingredient: "Pachulí de Bali · Tonka", benefit: "Fondo sustentable, persistencia" },
    ],
    clinicalResults: [],
    usage: {
      timing: ["AM", "PM"],
      frequency: "Según ocasión, en puntos de pulso",
      slot: "fragrance",
      position: 6,
    },
    target: {
      ageMin: 18,
      skinTypes: ["Todas"],
      concerns: [],
    },
    sensorial: {
      texture: "Eau de parfum, alta concentración",
      scent: "Floral gourmand — iris + vainilla + jazmín",
      feel: "Estela amplia, duración 8h+, presencia notable",
    },
    saleTip: "La fragancia femenina #1 ventas en México y top global de Lancôme desde 2012. Iris Pallida sustentable de Francia + pachulí Bali — la marca contó la historia ESG por años. Para clienta que quiere 'algo que no pase desapercibido'.",
    cautions: [
      "Estela amplia — aplicar 1-2 puntos máximo en oficinas/espacios cerrados",
    ],
    layerWith: [],
    source: "https://www.lancome-usa.com/fragrance/fragrance-by-collection/la-vie-est-belle/la-vie-est-belle-eau-de-parfum/100606.html",
  },

  // ── LC-LIA-100 · La Vie Est Belle Iris Absolu ───────────────────────────
  "LC-LIA-100": {
    keyActives: [
      { ingredient: "Grosella Negra · Higo · Flor de Azahar", benefit: "Salida frutal floral" },
      { ingredient: "Flor de Azahar · Jazmín", benefit: "Corazón floral cálido" },
      { ingredient: "Iris Pallida 10x", concentration: "10x más concentrado", benefit: "Fondo — corazón floral adictivo" },
      { ingredient: "Acorde Gourmand · Pachulí", benefit: "Fondo dulce-amaderado" },
    ],
    clinicalResults: [],
    usage: {
      timing: ["PM"],
      frequency: "Ocasiones especiales, en puntos de pulso",
      slot: "fragrance",
      position: 6,
    },
    target: {
      ageMin: 25,
      skinTypes: ["Todas"],
      concerns: [],
    },
    sensorial: {
      texture: "Eau de parfum, alta intensidad",
      scent: "Floral frutal gourmand — el iris en máxima expresión",
      feel: "Estela densa, duración 10h+, claramente nocturna",
    },
    saleTip: "Para clienta La Vie Est Belle clásica que quiere subir el escalón. 10x más iris Pallida = la versión más floral-intensa de la familia. Lanzamiento 2023, frasco recargable con sonrisa cristal — premium absoluto.",
    cautions: [
      "Intensidad alta — un solo punto es suficiente para todo el día",
    ],
    layerWith: ["LC-LVE-100" as Sku],
    source: "https://www.lancome-usa.com/fragrance/fragrance-by-collection/la-vie-est-belle/la-vie-est-belle-iris-absolu-eau-de-parfum/00751-LAC.html",
  },

  // ── LC-TRE-100 · Trésor EDP ─────────────────────────────────────────────
  "LC-TRE-100": {
    keyActives: [
      { ingredient: "Durazno · Damasco · Lila · Piña", benefit: "Salida frutal-floral aterciopelada" },
      { ingredient: "Bergamota · Lily-of-the-Valley", benefit: "Salida fresca verde" },
      { ingredient: "Rosa · Iris · Heliotropo · Jazmín", benefit: "Corazón floral clásico opulento" },
      { ingredient: "Sándalo · Vainilla · Ámbar · Almizcle", benefit: "Fondo oriental cremoso" },
    ],
    clinicalResults: [],
    usage: {
      timing: ["AM", "PM"],
      frequency: "Según ocasión, en puntos de pulso",
      slot: "fragrance",
      position: 6,
    },
    target: {
      ageMin: 25,
      skinTypes: ["Todas"],
      concerns: [],
    },
    sensorial: {
      texture: "Eau de parfum clásica",
      scent: "Floral oriental — rosa, durazno y vainilla suave",
      feel: "Estela elegante, duración 6-8h, presencia romántica",
    },
    saleTip: "Creada en 1990 por Sophia Grojsman — un clásico absoluto de Lancôme con 35+ años de éxito. Para clienta nostálgica o quien busca un perfume 'que huele a feminidad clásica'. El frasco pirámide invertida es icónico.",
    cautions: [],
    layerWith: [],
    source: "https://www.fragrantica.com/perfume/Lancome/Tresor-172.html",
  },

  // ── LC-MIR-100 · Miracle EDP ────────────────────────────────────────────
  "LC-MIR-100": {
    keyActives: [
      { ingredient: "Lichi · Fresia", benefit: "Salida frutal-floral fresca" },
      { ingredient: "Magnolia · Jengibre · Pimienta", benefit: "Corazón especiado luminoso" },
      { ingredient: "Ámbar · Jazmín · Almizcle", benefit: "Fondo cálido sensual" },
    ],
    clinicalResults: [],
    usage: {
      timing: ["AM"],
      frequency: "Según ocasión, especialmente día y primavera",
      slot: "fragrance",
      position: 6,
    },
    target: {
      ageMin: 18,
      skinTypes: ["Todas"],
      concerns: [],
    },
    sensorial: {
      texture: "Eau de parfum, intensidad media",
      scent: "Floral luminoso especiado — lichi y magnolia",
      feel: "Estela alegre y fresca, duración 5-6h, marcadamente diurna",
    },
    saleTip: "Creada en 2000 por Harry Fremont, Alberto Morillas y Christian Dussoulier — trío estrella. Para clienta que quiere un perfume 'fresco pero femenino', con carácter sin pesar. Posicionamiento de precio accesible para entrada a Lancôme.",
    cautions: [],
    layerWith: [],
    source: "https://www.fragrantica.com/perfume/Lancome/Miracle-184.html",
  },
};

export interface ProductTechRepository {
  find(sku: Sku): Promise<ProductTech | null>;
  list(): Promise<ReadonlyMap<Sku, ProductTech>>;
}

export const productTechRepository: ProductTechRepository = {
  async find(sku) {
    return TECH[sku as unknown as string] ?? null;
  },

  async list() {
    const out = new Map<Sku, ProductTech>();
    for (const [sku, tech] of Object.entries(TECH)) {
      out.set(sku as Sku, tech);
    }
    return out;
  },
};

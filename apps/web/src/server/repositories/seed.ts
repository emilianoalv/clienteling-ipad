import "server-only";
import type { Client, ClientId } from "@/types/client";
import type { Interaction } from "@/types/interaction";
import type { Purchase } from "@/types/purchase";
import type { Sample } from "@/types/sample";
import type { Recommendation } from "@/types/recommendation";
import type { Consent } from "@/types/consent";
import type { Communication, CommunicationId } from "@/types/communication";
import type { StaffId } from "@/types/staff";
import type { StoreId } from "@/types/store";
import type { Sku } from "@/types/product";

/**
 * In-memory seed used while the real backend is not wired (F4).
 * Designed so the UI is exercised across all client states (VIP / Recurrent /
 * New / AtRisk) with consistent IDs that cross-reference each other.
 */

const BA_ID = "ba-demo-ba" as StaffId;
const STORE_ID = "st-polanco" as StoreId;

export const SEED_CLIENTS: Client[] = [
  {
    id: "cl-valentina" as ClientId,
    name: "Valentina Cortázar",
    phone: "5512345678",
    email: "valentina.cortazar@example.mx",
    birthday: "1988-05-22",
    city: "Ciudad de México",
    age: 37,
    preferredLang: "es-MX",
    since: "2021-03-14",
    tier: "Atelier",
    brands: ["Lancôme", "YSL"],
    skin: { type: "Madura", concerns: ["Líneas finas", "Luminosidad"], tone: "Medio cálido" },
    allergies: [],
    loyalty: { name: "Luxe Circle", tier: "Atelier", points: 8420, toNext: 0 },
    stats: { ltv: 218_450, visits: 14, avgTicket: 15_603, lastPurchase: "2026-04-21" },
    affinities: ["Sérum antiedad", "Fragancia oriental"],
    interests: ["Skincare", "Fragancia"],
    routine: "Profesional",
  },
  {
    id: "cl-renata" as ClientId,
    name: "Renata Salazar",
    phone: "5587654321",
    email: "renata.salazar@example.mx",
    birthday: "1995-11-03",
    city: "Ciudad de México",
    age: 30,
    preferredLang: "es-MX",
    since: "2023-08-09",
    tier: "Icon",
    brands: ["Lancôme"],
    skin: { type: "Mixta", concerns: ["Poros", "Luminosidad"], tone: "Medio" },
    allergies: ["Fragancia ámbar"],
    loyalty: { name: "Luxe Circle", tier: "Icon", points: 3120, toNext: 1880 },
    stats: { ltv: 84_900, visits: 7, avgTicket: 12_128, lastPurchase: "2026-04-02" },
    affinities: ["Hydrating Boost"],
    interests: ["Skincare", "Maquillaje"],
    routine: "Avanzada",
  },
  {
    id: "cl-paola" as ClientId,
    name: "Paola Mendieta",
    phone: "5544556677",
    email: "paola.mendieta@example.mx",
    birthday: "1992-02-14",
    city: "Guadalajara",
    age: 33,
    preferredLang: "es-MX",
    since: "2022-06-01",
    tier: "Icon",
    brands: ["YSL"],
    skin: { type: "Seca", concerns: ["Hidratación", "Sensibilidad"], tone: "Claro" },
    allergies: [],
    loyalty: { name: "Luxe Circle", tier: "Icon", points: 1840, toNext: 3160 },
    stats: { ltv: 56_320, visits: 5, avgTicket: 11_264, lastPurchase: "2025-09-18" },
    affinities: ["Or Rouge", "Libre"],
    interests: ["Fragancia"],
    routine: "Intermedia",
  },
  {
    id: "cl-andrea" as ClientId,
    name: "Andrea Lozano",
    phone: "5511223344",
    email: "andrea.lozano@example.mx",
    birthday: "2000-07-09",
    city: "Monterrey",
    age: 25,
    preferredLang: "es-MX",
    since: "2026-02-12",
    tier: "Signature",
    brands: ["Lancôme"],
    skin: { type: "Grasa", concerns: ["Acné adulto", "Textura"], tone: "Medio" },
    allergies: [],
    loyalty: { name: "Luxe Circle", tier: "Signature", points: 420, toNext: 1580 },
    stats: { ltv: 4_980, visits: 1, avgTicket: 4_980, lastPurchase: "2026-03-30" },
    affinities: [],
    interests: ["Skincare"],
    routine: "Básica",
  },
  {
    id: "cl-camila" as ClientId,
    name: "Camila Iturbide",
    phone: "5599887766",
    email: "camila.iturbide@example.mx",
    birthday: "1985-10-30",
    city: "Ciudad de México",
    age: 40,
    preferredLang: "es-MX",
    since: "2020-01-22",
    tier: "Icon",
    brands: ["Lancôme", "YSL"],
    skin: { type: "Normal", concerns: ["Luminosidad"], tone: "Oscuro" },
    allergies: [],
    loyalty: { name: "Luxe Circle", tier: "Icon", points: 4920, toNext: 80 },
    stats: { ltv: 64_300, visits: 4, avgTicket: 16_075, lastPurchase: "2025-10-04" },
    affinities: ["Génifique", "Touche Éclat"],
    interests: ["Skincare", "Maquillaje", "Fragancia"],
    routine: "Avanzada",
  },
];

export const SEED_PURCHASES: Purchase[] = [
  {
    id: "pu-1" as Purchase["id"],
    clientId: "cl-valentina" as ClientId,
    baId: BA_ID,
    storeId: STORE_ID,
    at: "2026-04-21T18:32:00.000Z",
    items: [
      { sku: "LC-ABS-50" as Sku, qty: 1, unitPrice: 9_800 },
      { sku: "LC-GEN-50" as Sku, qty: 1, unitPrice: 6_400 },
    ],
    total: 16_200,
    payment: "card",
    brand: "Lancôme",
    ticketRef: "LV-260421-0892",
  },
  {
    id: "pu-2" as Purchase["id"],
    clientId: "cl-renata" as ClientId,
    baId: BA_ID,
    storeId: STORE_ID,
    at: "2026-04-02T16:11:00.000Z",
    items: [{ sku: "LC-HYB-30" as Sku, qty: 1, unitPrice: 12_100 }],
    total: 12_100,
    payment: "card",
    brand: "Lancôme",
    ticketRef: "LV-260402-0145",
  },
  {
    id: "pu-3" as Purchase["id"],
    clientId: "cl-paola" as ClientId,
    baId: BA_ID,
    storeId: STORE_ID,
    at: "2026-03-14T13:45:00.000Z",
    items: [{ sku: "YS-OR-100" as Sku, qty: 1, unitPrice: 6_490 }],
    total: 6_490,
    payment: "card",
    brand: "YSL",
    ticketRef: "PH-260314-0441",
  },
  {
    id: "pu-4" as Purchase["id"],
    clientId: "cl-camila" as ClientId,
    baId: BA_ID,
    storeId: STORE_ID,
    at: "2026-04-21T12:10:00.000Z",
    items: [{ sku: "YS-RPC-01" as Sku, qty: 3, unitPrice: 950 }],
    total: 2_850,
    payment: "cash",
    brand: "YSL",
    ticketRef: "PH-260421-0054",
  },
];

export const SEED_INTERACTIONS: Interaction[] = [
  {
    id: "int-1" as Interaction["id"],
    clientId: "cl-valentina" as ClientId,
    baId: BA_ID,
    brand: "Lancôme",
    kind: "purchase",
    at: "2026-04-21T18:32:00.000Z",
    amount: 16_200,
  },
  {
    id: "int-2" as Interaction["id"],
    clientId: "cl-valentina" as ClientId,
    baId: BA_ID,
    brand: "YSL",
    kind: "consultation",
    at: "2026-03-15T15:00:00.000Z",
    durationMin: 45,
    notes: "Renovó descubrimiento Or Rouge; interesada en travel size.",
  },
  {
    id: "int-3" as Interaction["id"],
    clientId: "cl-renata" as ClientId,
    baId: BA_ID,
    brand: "Lancôme",
    kind: "sample",
    at: "2026-04-08T14:20:00.000Z",
    notes: "Muestra Hydrating Boost 7d.",
  },
];

export const SEED_SAMPLES: Sample[] = [
  {
    id: "sp-1" as Sample["id"],
    clientId: "cl-renata" as ClientId,
    baId: BA_ID,
    sku: "LC-HYB-7" as Sku,
    name: "Hydrating Boost · 7d",
    givenAt: "2026-04-08T14:20:00.000Z",
    followUpAt: "2026-04-22T00:00:00.000Z",
    converted: false,
  },
];

export const SEED_RECOMMENDATIONS: Recommendation[] = [
  {
    id: "rc-1" as Recommendation["id"],
    clientId: "cl-valentina" as ClientId,
    baId: BA_ID,
    at: "2026-04-21T18:00:00.000Z",
    items: ["LC-ABS-50" as Sku, "LC-GEN-50" as Sku],
    status: "converted",
    purchaseId: "pu-1" as Purchase["id"],
  },
];

export const SEED_COMMUNICATIONS: Communication[] = [
  {
    id: "cm-1" as CommunicationId,
    clientId: "cl-valentina" as ClientId,
    baId: BA_ID,
    brand: "Lancôme",
    channel: "WhatsApp",
    direction: "outbound",
    at: "2026-04-22T14:32:00.000Z",
    templateId: "tpl-postvisit-es",
    body: "Hola Valentina, ¿cómo te sentiste con el sérum Or Rouge?",
    status: "read",
  },
  {
    id: "cm-2" as CommunicationId,
    clientId: "cl-valentina" as ClientId,
    baId: BA_ID,
    brand: "Lancôme",
    channel: "WhatsApp",
    direction: "inbound",
    at: "2026-04-22T18:04:00.000Z",
    body: "¡Increíble, notó mi marido el brillo!",
    status: "read",
  },
  {
    id: "cm-3" as CommunicationId,
    clientId: "cl-valentina" as ClientId,
    baId: BA_ID,
    brand: "Lancôme",
    channel: "Email",
    direction: "outbound",
    at: "2026-04-10T09:00:00.000Z",
    templateId: "tpl-birthday-es",
    body: "Feliz cumpleaños — obsequio en tienda.",
    status: "delivered",
  },
  {
    id: "cm-4" as CommunicationId,
    clientId: "cl-renata" as ClientId,
    baId: BA_ID,
    brand: "Lancôme",
    channel: "SMS",
    direction: "outbound",
    at: "2026-04-20T11:00:00.000Z",
    templateId: "tpl-replenish-es",
    body: "Tu Libre Le Parfum está por terminarse…",
    status: "read",
  },
  {
    id: "cm-5" as CommunicationId,
    clientId: "cl-paola" as ClientId,
    baId: BA_ID,
    brand: "YSL",
    channel: "WhatsApp",
    direction: "outbound",
    at: "2026-04-15T10:00:00.000Z",
    templateId: "tpl-launch-es",
    body: "Paola, acaba de llegar Libre Le Parfum Intense. ¿Te gustaría reservar tu prueba?",
    status: "delivered",
  },
];

export const SEED_CONSENTS: Consent[] = [
  {
    id: "co-1" as Consent["id"],
    clientId: "cl-valentina" as ClientId,
    channel: "WhatsApp",
    status: "granted",
    at: "2025-10-01T00:00:00.000Z",
    version: "v2026.03",
    source: "in-store",
  },
  {
    id: "co-2" as Consent["id"],
    clientId: "cl-valentina" as ClientId,
    channel: "Email",
    status: "granted",
    at: "2025-10-01T00:00:00.000Z",
    version: "v2026.03",
    source: "in-store",
  },
];

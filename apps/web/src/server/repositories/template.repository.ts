import "server-only";
import type { BrandId } from "@/types/brand";
import type { Template, TemplateId } from "@/types/template";

// Catálogo de plantillas obligatorias por marca (acordado con el cliente):
//   seguimiento · cumpleaños · promoción · reposición
// Cada marca tiene su propia voz: Lancôme cálido/cercano, YSL bold/lujoso.
// Cumpleaños existe en WhatsApp y Email para ambas marcas (la BA elige
// según el cliente). Las plantillas heredadas (Post-visita, Lanzamiento,
// Muestra) se conservan porque siguen activas en flujos específicos
// (Post-visita para 3m/6m check, Muestra para sample-feedback).
//
// Tokens dot-notation ({muestra.producto}, {compra.dia}, etc.) los
// resuelve `resolveTaskContext` cuando el composer abre desde una task.
// Si no hay contexto (cliente nuevo, sin compras), la plantilla deja el
// token literal — la BA lo edita antes de enviar. (Opción A acordada.)
const SEED: Template[] = [
  // ── Lancôme ─────────────────────────────────────────────────────────
  {
    id: "tpl-postvisit-es" as TemplateId,
    brand: "Lancôme",
    channel: "WhatsApp",
    category: "Post-visita",
    body:
      "{nombre}, fue un placer atenderte hoy en {tienda}. Te comparto la rutina que personalicé para ti. Cualquier duda, aquí estoy. — {ba}",
    tokens: ["{nombre}", "{tienda}", "{ba}"],
  },
  {
    id: "tpl-seguimiento-lancome" as TemplateId,
    brand: "Lancôme",
    channel: "WhatsApp",
    category: "Seguimiento",
    body:
      "{nombre}, paso a saludarte desde Lancôme. ¿Cómo te ha ido con {compra.producto} desde que lo llevaste {compra.dia}? Si quieres ajustar algo o tienes dudas, aquí estoy para ti. — {ba}",
    tokens: ["{nombre}", "{compra.producto}", "{compra.dia}", "{ba}"],
  },
  {
    id: "tpl-birthday-lancome-wa" as TemplateId,
    brand: "Lancôme",
    channel: "WhatsApp",
    category: "Cumpleaños",
    body:
      "¡Feliz cumpleaños, {nombre}! Desde Lancôme te enviamos un abrazo. Pásate por {tienda} este mes — te tenemos preparado un detalle especial. — {ba}",
    tokens: ["{nombre}", "{tienda}", "{ba}"],
  },
  {
    id: "tpl-birthday-es" as TemplateId,
    brand: "Lancôme",
    channel: "Email",
    category: "Cumpleaños",
    body:
      "Feliz cumpleaños, {nombre}. Te esperamos en {tienda} con un obsequio especial durante el mes.",
    tokens: ["{nombre}", "{tienda}"],
  },
  {
    id: "tpl-promocion-lancome" as TemplateId,
    brand: "Lancôme",
    channel: "WhatsApp",
    category: "Promoción",
    body:
      "{nombre}, tenemos una promoción especial Lancôme en {tienda} esta semana. Pensé que podría interesarte — ¿te aparto el tuyo? — {ba}",
    tokens: ["{nombre}", "{tienda}", "{ba}"],
  },
  {
    id: "tpl-replenish-es" as TemplateId,
    brand: "Lancôme",
    channel: "WhatsApp",
    category: "Reposición",
    body:
      "Hola {nombre}, ¿cómo vas con tu {compra.producto}? Te lo llevaste {compra.dia} — si te está por acabar, te reservo uno nuevo. — {ba}",
    tokens: ["{nombre}", "{compra.producto}", "{compra.dia}", "{ba}"],
  },
  {
    id: "tpl-sample-lancome" as TemplateId,
    brand: "Lancôme",
    channel: "WhatsApp",
    category: "Muestra",
    body:
      "{nombre}, ¿cómo te ha ido con la muestra de {muestra.producto} que te llevaste {muestra.dia}? Cualquier impresión que tengas me encantaría escucharla. — {ba}, Lancôme",
    tokens: ["{nombre}", "{muestra.producto}", "{muestra.dia}", "{ba}"],
  },

  // ── YSL Beauty ───────────────────────────────────────────────────────
  {
    id: "tpl-launch-es" as TemplateId,
    brand: "YSL",
    channel: "WhatsApp",
    category: "Lanzamiento",
    body:
      "{nombre}, acaba de llegar {producto}. ¿Te gustaría reservar tu prueba? — {ba}, YSL Beauty",
    tokens: ["{nombre}", "{producto}", "{ba}"],
  },
  {
    id: "tpl-sample-es" as TemplateId,
    brand: "YSL",
    channel: "WhatsApp",
    category: "Muestra",
    body:
      "{nombre}, ¿cómo te sentiste con la muestra de {muestra.producto} que te llevaste {muestra.dia}? Me encantaría escuchar tu experiencia. — {ba}, YSL Beauty",
    tokens: ["{nombre}", "{muestra.producto}", "{muestra.dia}", "{ba}"],
  },
  {
    id: "tpl-seguimiento-ysl" as TemplateId,
    brand: "YSL",
    channel: "WhatsApp",
    category: "Seguimiento",
    body:
      "{nombre}, soy {ba} de YSL Beauty. Quería darte seguimiento — ¿cómo te ha estado sentando {compra.producto}? Cuéntame cuando puedas.",
    tokens: ["{nombre}", "{compra.producto}", "{ba}"],
  },
  {
    id: "tpl-birthday-ysl-wa" as TemplateId,
    brand: "YSL",
    channel: "WhatsApp",
    category: "Cumpleaños",
    body:
      "{nombre}, hoy es tu día. YSL Beauty te espera en {tienda} con un detalle único. Búscame cuando vengas. — {ba}",
    tokens: ["{nombre}", "{tienda}", "{ba}"],
  },
  {
    id: "tpl-birthday-ysl-email" as TemplateId,
    brand: "YSL",
    channel: "Email",
    category: "Cumpleaños",
    body:
      "{nombre}, felicidades de parte de YSL Beauty. Este mes te tenemos una experiencia exclusiva en {tienda}. Cuando quieras, agenda tu visita.",
    tokens: ["{nombre}", "{tienda}"],
  },
  {
    id: "tpl-promocion-ysl" as TemplateId,
    brand: "YSL",
    channel: "WhatsApp",
    category: "Promoción",
    body:
      "{nombre}, edición limitada YSL Beauty disponible en {tienda} esta semana. Tu nombre va primero — ¿lo reservo? — {ba}",
    tokens: ["{nombre}", "{tienda}", "{ba}"],
  },
  {
    id: "tpl-replenish-ysl" as TemplateId,
    brand: "YSL",
    channel: "WhatsApp",
    category: "Reposición",
    body:
      "{nombre}, ¿cómo vas con tu {compra.producto}? Lo elegiste {compra.dia} — si está por terminar, te lo aparto y lo recoges cuando puedas. — {ba}, YSL Beauty",
    tokens: ["{nombre}", "{compra.producto}", "{compra.dia}", "{ba}"],
  },
];

import { persistent } from "./_persist";
// v4 invalida el seed v3 para que el HMR cargue la plantilla Muestra
// Lancôme (faltaba — solo YSL tenía Muestra y el matching fallaba
// para tasks sample-feedback de clientas Lancôme).
const TEMPLATES = persistent(
  "__clienteling.templates.v4",
  () => new Map<TemplateId, Template>(SEED.map((t) => [t.id, t])),
);

export interface TemplateListFilter {
  brands?: readonly BrandId[];
  channel?: Template["channel"];
}

export interface TemplateRepository {
  list(filter?: TemplateListFilter): Promise<Template[]>;
  findById(id: TemplateId): Promise<Template | null>;
}

export const templateRepository: TemplateRepository = {
  async list(filter = {}) {
    const all = Array.from(TEMPLATES.values());
    const scope = filter.brands;
    return all.filter((t) => {
      if (scope && scope.length && !scope.includes(t.brand)) return false;
      if (filter.channel && t.channel !== filter.channel) return false;
      return true;
    });
  },
  async findById(id) {
    return TEMPLATES.get(id) ?? null;
  },
};

import "server-only";
import type { BrandId } from "@/types/brand";
import type { Template, TemplateId } from "@/types/template";

const SEED: Template[] = [
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
    id: "tpl-launch-es" as TemplateId,
    brand: "YSL",
    channel: "WhatsApp",
    category: "Lanzamiento",
    body: "{nombre}, acaba de llegar {producto}. ¿Te gustaría reservar tu prueba? — {ba}, YSL Beauty",
    tokens: ["{nombre}", "{producto}", "{ba}"],
  },
  {
    id: "tpl-birthday-es" as TemplateId,
    brand: "Lancôme",
    channel: "Email",
    category: "Cumpleaños",
    body: "Feliz cumpleaños, {nombre}. Te esperamos en {tienda} con un obsequio especial durante el mes.",
    tokens: ["{nombre}", "{tienda}"],
  },
  {
    id: "tpl-replenish-es" as TemplateId,
    brand: "Lancôme",
    channel: "WhatsApp",
    category: "Reposición",
    body: "Hola {nombre}, ¿cómo vas con tu {producto}? Si te está por acabar, te reservo uno nuevo.",
    tokens: ["{nombre}", "{producto}"],
  },
  {
    id: "tpl-sample-es" as TemplateId,
    brand: "YSL",
    channel: "WhatsApp",
    category: "Muestra",
    body:
      "{nombre}, ¿cómo te sentiste con la muestra de {producto}? Me encantaría escuchar tu experiencia.",
    tokens: ["{nombre}", "{producto}"],
  },
];

import { persistent } from "./_persist";
const TEMPLATES = persistent("__clienteling.templates", () => new Map<TemplateId, Template>(SEED.map((t) => [t.id, t])));

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

import type { BrandId } from "./brand";
import type { Branded } from "./branded";
import type { Channel } from "./communication";

export type TemplateId = Branded<string, "Template">;

export type TemplateCategory =
  | "Post-visita"
  | "Seguimiento"
  | "Lanzamiento"
  | "Cumpleaños"
  | "Reposición"
  | "Promoción"
  | "Muestra"
  | "Aniversario"
  | "Recordatorio cita"
  | "Otro";

export type TemplateToken = "{nombre}" | "{tienda}" | "{ba}" | "{producto}" | "{fecha}";

export interface Template {
  id: TemplateId;
  brand: BrandId;
  channel: Channel;
  category: TemplateCategory;
  body: string;
  /** Tokens declared in the body — used to render the tokens chip strip. */
  tokens: readonly TemplateToken[];
}

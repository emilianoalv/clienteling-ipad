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

/**
 * Tokens reconocidos en los bodies de plantillas. Los simples son los
 * heredados; los dot-notation traen contexto resuelto por
 * `resolveTaskContext` para que el mensaje suene natural en español:
 *
 *   {muestra.producto} → "Iris Absolu Eau de Parfum"
 *   {muestra.dia}      → "el lunes" / "la semana pasada"
 *   {compra.producto}  → "Génifique Sérum"
 *   {compra.dia}       → "ayer" / "hace 2 semanas"
 *   {compra.fecha}     → "15 abr" (formato corto, para Email donde
 *                        el tono conversacional no es prioritario)
 */
export type TemplateToken =
  | "{nombre}"
  | "{tienda}"
  | "{ba}"
  | "{producto}"
  | "{fecha}"
  | "{muestra.producto}"
  | "{muestra.dia}"
  | "{compra.producto}"
  | "{compra.dia}"
  | "{compra.fecha}";

export interface Template {
  id: TemplateId;
  brand: BrandId;
  channel: Channel;
  category: TemplateCategory;
  body: string;
  /** Tokens declared in the body — used to render the tokens chip strip. */
  tokens: readonly TemplateToken[];
}

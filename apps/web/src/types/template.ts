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
 * `resolveTaskContext` (para tasks) o por la propia página del composer
 * (para intents de evento) para que el mensaje suene natural en español:
 *
 *   {muestra.producto} → "Iris Absolu Eau de Parfum"
 *   {muestra.dia}      → "el lunes" / "la semana pasada"
 *   {compra.producto}  → "Génifique Sérum" (siempre el primero, legacy)
 *   {compra.productos} → "Génifique Sérum y Absolue Eye Cream" o
 *                        "Génifique Sérum, Absolue Eye Cream y Idôle EDP".
 *                        Lista natural en línea para chats. Cuando es 1
 *                        solo item, equivale a {compra.producto}.
 *   {compra.productos.lista} → "• Génifique Sérum\n• Absolue Eye Cream".
 *                        Bullet vertical, ideal para Email donde el
 *                        cliente lleva 2-3 productos y vale la pena
 *                        listarlos uno por línea.
 *   {compra.dia}       → "ayer" / "hace 2 semanas"
 *   {compra.fecha}     → "15 abr" (formato corto, para Email donde
 *                        el tono conversacional no es prioritario)
 *   {evento.anos}      → "3" — años cumplidos del aniversario como
 *                        clienta. Solo se usa en plantillas Aniversario.
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
  | "{compra.productos}"
  | "{compra.productos.lista}"
  | "{compra.dia}"
  | "{compra.fecha}"
  | "{evento.anos}";

export interface Template {
  id: TemplateId;
  brand: BrandId;
  channel: Channel;
  category: TemplateCategory;
  body: string;
  /** Tokens declared in the body — used to render the tokens chip strip. */
  tokens: readonly TemplateToken[];
}

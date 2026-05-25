import type { Template, TemplateToken } from "@/types/template";

/**
 * Contexto de render con keys planas. Los dot-notation viven como keys
 * literales (TypeScript las permite) para que el lookup en `renderTemplate`
 * sea un acceso directo sin reconstruir paths anidados.
 */
export interface TemplateContext {
  nombre?: string;
  tienda?: string;
  ba?: string;
  producto?: string;
  fecha?: string;
  "muestra.producto"?: string;
  "muestra.productos"?: string;
  "muestra.productos.lista"?: string;
  "muestra.dia"?: string;
  "compra.producto"?: string;
  "compra.productos"?: string;
  "compra.productos.lista"?: string;
  "compra.dia"?: string;
  "compra.fecha"?: string;
  "evento.anos"?: string;
}

const TOKEN_KEY: Record<TemplateToken, keyof TemplateContext> = {
  "{nombre}": "nombre",
  "{tienda}": "tienda",
  "{ba}": "ba",
  "{producto}": "producto",
  "{fecha}": "fecha",
  "{muestra.producto}": "muestra.producto",
  "{muestra.productos}": "muestra.productos",
  "{muestra.productos.lista}": "muestra.productos.lista",
  "{muestra.dia}": "muestra.dia",
  "{compra.producto}": "compra.producto",
  "{compra.productos}": "compra.productos",
  "{compra.productos.lista}": "compra.productos.lista",
  "{compra.dia}": "compra.dia",
  "{compra.fecha}": "compra.fecha",
  "{evento.anos}": "evento.anos",
};

/**
 * Renders a template body by replacing every `{token}` with the matching
 * context value. Si el token no resuelve (no está en el context o el
 * value es undefined), lo deja literal — el caller decide si avisar a la
 * BA o solo enviar como está.
 *
 * Pure — testable in isolation. Soporta tokens simples y dot-notation
 * (regex `[a-z.]+`).
 */
export function renderTemplate(template: Template, context: TemplateContext): string {
  return template.body.replace(/\{[a-z.]+\}/g, (match) => {
    const key = TOKEN_KEY[match as TemplateToken];
    if (!key) return match;
    return context[key] ?? match;
  });
}

/**
 * Formatea una lista de nombres como frase natural en español:
 *   1 → "X"
 *   2 → "X y Y"
 *   3+ → "X, Y y Z"
 *
 * Pure helper — usado por `resolveTaskContext` para multi-producto.
 */
export function formatNameList(names: readonly string[]): string {
  if (names.length === 0) return "";
  if (names.length === 1) return names[0]!;
  if (names.length === 2) return `${names[0]} y ${names[1]}`;
  const head = names.slice(0, -1).join(", ");
  return `${head} y ${names[names.length - 1]}`;
}

/** Versión vertical con bullets — útil para Email cuando hay 2+ items. */
export function formatBulletList(names: readonly string[]): string {
  return names.map((n) => `• ${n}`).join("\n");
}

/** Returns the tokens that are declared by the template but not provided. */
export function missingTokens(
  template: Template,
  context: TemplateContext,
): readonly TemplateToken[] {
  return template.tokens.filter((tok) => {
    const key = TOKEN_KEY[tok];
    return !key || !context[key];
  });
}

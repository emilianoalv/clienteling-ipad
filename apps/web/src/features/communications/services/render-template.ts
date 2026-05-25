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
  "muestra.dia"?: string;
  "compra.producto"?: string;
  "compra.dia"?: string;
  "compra.fecha"?: string;
}

const TOKEN_KEY: Record<TemplateToken, keyof TemplateContext> = {
  "{nombre}": "nombre",
  "{tienda}": "tienda",
  "{ba}": "ba",
  "{producto}": "producto",
  "{fecha}": "fecha",
  "{muestra.producto}": "muestra.producto",
  "{muestra.dia}": "muestra.dia",
  "{compra.producto}": "compra.producto",
  "{compra.dia}": "compra.dia",
  "{compra.fecha}": "compra.fecha",
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

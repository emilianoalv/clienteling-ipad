import type { Template, TemplateToken } from "@/types/template";

export interface TemplateContext {
  nombre?: string;
  tienda?: string;
  ba?: string;
  producto?: string;
  fecha?: string;
}

const TOKEN_KEY: Record<TemplateToken, keyof TemplateContext> = {
  "{nombre}": "nombre",
  "{tienda}": "tienda",
  "{ba}": "ba",
  "{producto}": "producto",
  "{fecha}": "fecha",
};

/**
 * Renders a template body by replacing every `{token}` with the matching
 * context value (or leaving the token in place if no value is supplied).
 *
 * Pure — testable in isolation.
 */
export function renderTemplate(template: Template, context: TemplateContext): string {
  return template.body.replace(/\{[a-z]+\}/g, (match) => {
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

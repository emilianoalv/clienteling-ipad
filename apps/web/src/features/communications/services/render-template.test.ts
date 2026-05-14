import { describe, expect, it } from "vitest";
import type { Template, TemplateId } from "@/types/template";
import { missingTokens, renderTemplate } from "./render-template";

function tpl(body: string, tokens: Template["tokens"]): Template {
  return {
    id: "tpl-x" as TemplateId,
    brand: "Lancôme",
    channel: "WhatsApp",
    category: "Post-visita",
    body,
    tokens,
  };
}

describe("renderTemplate", () => {
  it("replaces known tokens with the matching context value", () => {
    const out = renderTemplate(
      tpl("Hola {nombre}, te esperamos en {tienda}. — {ba}", ["{nombre}", "{tienda}", "{ba}"]),
      { nombre: "Valentina", tienda: "Liverpool Polanco", ba: "Andrea" },
    );
    expect(out).toBe("Hola Valentina, te esperamos en Liverpool Polanco. — Andrea");
  });

  it("leaves the token in place when no value is provided", () => {
    const out = renderTemplate(
      tpl("Hola {nombre}, sobre {producto}", ["{nombre}", "{producto}"]),
      { nombre: "Ana" },
    );
    expect(out).toBe("Hola Ana, sobre {producto}");
  });

  it("missingTokens lists only the unfilled ones", () => {
    const t = tpl("Hola {nombre}, sobre {producto}", ["{nombre}", "{producto}"]);
    expect(missingTokens(t, { nombre: "Ana" })).toEqual(["{producto}"]);
    expect(missingTokens(t, { nombre: "Ana", producto: "Libre" })).toEqual([]);
  });
});

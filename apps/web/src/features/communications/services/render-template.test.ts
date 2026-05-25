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

  it("reemplaza tokens dot-notation (muestra.producto + muestra.dia)", () => {
    const out = renderTemplate(
      tpl(
        "{nombre}, ¿cómo te ha ido con la muestra de {muestra.producto} que te llevaste {muestra.dia}?",
        ["{nombre}", "{muestra.producto}", "{muestra.dia}"],
      ),
      {
        nombre: "Gabriela",
        "muestra.producto": "Iris Absolu Eau de Parfum",
        "muestra.dia": "el lunes",
      },
    );
    expect(out).toBe(
      "Gabriela, ¿cómo te ha ido con la muestra de Iris Absolu Eau de Parfum que te llevaste el lunes?",
    );
  });

  it("reemplaza tokens dot-notation de compra", () => {
    const out = renderTemplate(
      tpl(
        "Hola {nombre}, ¿cómo vas con tu {compra.producto}? Te lo llevaste {compra.dia}.",
        ["{nombre}", "{compra.producto}", "{compra.dia}"],
      ),
      {
        nombre: "Andrea",
        "compra.producto": "Génifique Sérum",
        "compra.dia": "hace 2 semanas",
      },
    );
    expect(out).toBe(
      "Hola Andrea, ¿cómo vas con tu Génifique Sérum? Te lo llevaste hace 2 semanas.",
    );
  });

  it("deja tokens dot-notation literales cuando el contexto falta", () => {
    const out = renderTemplate(
      tpl("Hola {nombre}, sobre {compra.producto}", ["{nombre}", "{compra.producto}"]),
      { nombre: "Ana" },
    );
    expect(out).toBe("Hola Ana, sobre {compra.producto}");
  });
});

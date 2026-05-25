import { describe, expect, it } from "vitest";
import { buildFollowupDescription } from "./build-followup-description";

describe("buildFollowupDescription", () => {
  describe("sin contexto de productos", () => {
    it("call → 'Llamar a {nombre}'", () => {
      expect(buildFollowupDescription({ type: "call", firstName: "Regina" })).toBe(
        "Llamar a Regina",
      );
    });

    it("whatsapp → 'Mensaje WhatsApp a {nombre}'", () => {
      expect(buildFollowupDescription({ type: "whatsapp", firstName: "Regina" })).toBe(
        "Mensaje WhatsApp a Regina",
      );
    });

    it("email → 'Correo a {nombre}'", () => {
      expect(buildFollowupDescription({ type: "email", firstName: "Regina" })).toBe(
        "Correo a Regina",
      );
    });

    it("sample-feedback → 'Pedir feedback de muestra a {nombre}'", () => {
      expect(buildFollowupDescription({ type: "sample-feedback", firstName: "Regina" })).toBe(
        "Pedir feedback de muestra a Regina",
      );
    });

    it("appointment → 'Agendar cita con {nombre}'", () => {
      expect(buildFollowupDescription({ type: "appointment", firstName: "Regina" })).toBe(
        "Agendar cita con Regina",
      );
    });

    it("other → 'Seguimiento con {nombre}'", () => {
      expect(buildFollowupDescription({ type: "other", firstName: "Regina" })).toBe(
        "Seguimiento con Regina",
      );
    });
  });

  describe("con contexto de muestra", () => {
    const ctx = { kind: "sample" as const, productNames: ["La Vie Est Belle", "Hydra Zen"] };

    it("call menciona la muestra", () => {
      expect(buildFollowupDescription({ type: "call", firstName: "Regina", context: ctx })).toBe(
        "Llamar a Regina para pedir feedback de la muestra de La Vie Est Belle y Hydra Zen",
      );
    });

    it("whatsapp menciona la muestra", () => {
      expect(buildFollowupDescription({ type: "whatsapp", firstName: "Regina", context: ctx })).toBe(
        "Mensaje WhatsApp a Regina pidiendo feedback de la muestra de La Vie Est Belle y Hydra Zen",
      );
    });

    it("sample-feedback usa frase natural con productos", () => {
      expect(
        buildFollowupDescription({ type: "sample-feedback", firstName: "Regina", context: ctx }),
      ).toBe("Pedir feedback de la muestra de La Vie Est Belle y Hydra Zen a Regina");
    });

    it("appointment lo conecta a la experiencia con las muestras", () => {
      expect(
        buildFollowupDescription({ type: "appointment", firstName: "Regina", context: ctx }),
      ).toBe("Agendar cita con Regina para revisar su experiencia con La Vie Est Belle y Hydra Zen");
    });
  });

  describe("con contexto de compra", () => {
    const ctx = { kind: "purchase" as const, productNames: ["Advanced Génifique"] };

    it("call menciona la compra (1 producto)", () => {
      expect(buildFollowupDescription({ type: "call", firstName: "Regina", context: ctx })).toBe(
        "Llamar a Regina para pedir feedback de su compra: Advanced Génifique",
      );
    });

    it("whatsapp menciona la compra", () => {
      expect(buildFollowupDescription({ type: "whatsapp", firstName: "Regina", context: ctx })).toBe(
        "Mensaje WhatsApp a Regina sobre su compra de Advanced Génifique",
      );
    });

    it("email menciona la compra", () => {
      expect(buildFollowupDescription({ type: "email", firstName: "Regina", context: ctx })).toBe(
        "Correo a Regina sobre su compra de Advanced Génifique",
      );
    });

    it("appointment liga el seguimiento a evaluar el producto", () => {
      expect(
        buildFollowupDescription({ type: "appointment", firstName: "Regina", context: ctx }),
      ).toBe("Agendar próxima cita con Regina para evaluar Advanced Génifique");
    });
  });

  describe("formateo de listas de productos", () => {
    it("3 productos usan coma + 'y'", () => {
      const ctx = {
        kind: "purchase" as const,
        productNames: ["Advanced Génifique", "Absolue Soft Cream", "Idôle EDP"],
      };
      expect(buildFollowupDescription({ type: "whatsapp", firstName: "Regina", context: ctx })).toBe(
        "Mensaje WhatsApp a Regina sobre su compra de Advanced Génifique, Absolue Soft Cream y Idôle EDP",
      );
    });

    it("contexto sin productos cae al texto sin lista", () => {
      const ctx = { kind: "sample" as const, productNames: [] };
      expect(buildFollowupDescription({ type: "call", firstName: "Regina", context: ctx })).toBe(
        "Llamar a Regina",
      );
    });
  });
});

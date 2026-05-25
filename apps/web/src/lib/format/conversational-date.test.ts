import { describe, expect, it } from "vitest";
import { formatConversationalDate } from "./conversational-date";

// Anclamos `now` a un viernes para que los días de la semana sean
// determinísticos sin importar cuándo corra el test.
const NOW = new Date("2026-05-22T12:00:00Z"); // viernes

function iso(daysAgo: number): string {
  const d = new Date(NOW);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

describe("formatConversationalDate", () => {
  it("0 días = hoy", () => {
    expect(formatConversationalDate(iso(0), NOW)).toBe("hoy");
  });

  it("1 día = ayer", () => {
    expect(formatConversationalDate(iso(1), NOW)).toBe("ayer");
  });

  it("2-6 días devuelve día de la semana con artículo", () => {
    // NOW = viernes 22 mayo 2026
    expect(formatConversationalDate(iso(2), NOW)).toBe("el miércoles");
    expect(formatConversationalDate(iso(4), NOW)).toBe("el lunes");
    expect(formatConversationalDate(iso(6), NOW)).toBe("el sábado");
  });

  it("7-13 días = la semana pasada", () => {
    expect(formatConversationalDate(iso(7), NOW)).toBe("la semana pasada");
    expect(formatConversationalDate(iso(10), NOW)).toBe("la semana pasada");
    expect(formatConversationalDate(iso(13), NOW)).toBe("la semana pasada");
  });

  it("14-30 días = hace N semanas", () => {
    expect(formatConversationalDate(iso(14), NOW)).toBe("hace 2 semanas");
    expect(formatConversationalDate(iso(21), NOW)).toBe("hace 3 semanas");
    expect(formatConversationalDate(iso(28), NOW)).toBe("hace 4 semanas");
  });

  it("31-60 días = hace un mes", () => {
    expect(formatConversationalDate(iso(45), NOW)).toBe("hace un mes");
  });

  it("60+ días = hace N meses", () => {
    expect(formatConversationalDate(iso(90), NOW)).toBe("hace 3 meses");
    expect(formatConversationalDate(iso(180), NOW)).toBe("hace 6 meses");
  });

  it("fecha futura devuelve cadena vacía", () => {
    expect(formatConversationalDate(iso(-3), NOW)).toBe("");
  });

  it("iso inválido devuelve cadena vacía", () => {
    expect(formatConversationalDate("not-a-date", NOW)).toBe("");
  });
});

import { describe, expect, it } from "vitest";
import { buildMessageUrl, normalizePhone } from "./build-message-url";

describe("normalizePhone", () => {
  it("strips spaces, dashes, parens and plus signs", () => {
    expect(normalizePhone("+52 55 1234 5678")).toBe("525512345678");
    expect(normalizePhone("(55) 1234-5678")).toBe("5512345678");
    expect(normalizePhone("+1 (415) 555-0100")).toBe("14155550100");
  });

  it("handles empty input", () => {
    expect(normalizePhone("")).toBe("");
  });
});

describe("buildMessageUrl · WhatsApp", () => {
  it("builds wa.me with phone and encoded body", () => {
    const url = buildMessageUrl({
      channel: "WhatsApp",
      phone: "+52 55 1234 5678",
      body: "Hola María, ¿cómo te fue con la muestra?",
    });
    expect(url).toBe(
      "https://wa.me/525512345678?text=Hola%20Mar%C3%ADa%2C%20%C2%BFc%C3%B3mo%20te%20fue%20con%20la%20muestra%3F",
    );
  });

  it("falls back to empty phone (opens WhatsApp contact picker)", () => {
    const url = buildMessageUrl({ channel: "WhatsApp", body: "Hola" });
    expect(url).toBe("https://wa.me/?text=Hola");
  });
});

describe("buildMessageUrl · Email", () => {
  it("builds mailto with subject + body", () => {
    const url = buildMessageUrl({
      channel: "Email",
      email: "isa@example.mx",
      subject: "Seguimiento muestra",
      body: "Hola, ¿qué tal te fue?",
    });
    expect(url).toBe(
      "mailto:isa@example.mx?subject=Seguimiento%20muestra&body=Hola%2C%20%C2%BFqu%C3%A9%20tal%20te%20fue%3F",
    );
  });

  it("omits subject when not provided", () => {
    const url = buildMessageUrl({
      channel: "Email",
      email: "test@example.com",
      body: "Cuerpo",
    });
    expect(url).toBe("mailto:test@example.com?body=Cuerpo");
  });
});

describe("buildMessageUrl · SMS", () => {
  it("builds sms: with phone and body", () => {
    const url = buildMessageUrl({
      channel: "SMS",
      phone: "555-1234",
      body: "Recordatorio cita",
    });
    expect(url).toBe("sms:5551234?body=Recordatorio%20cita");
  });
});

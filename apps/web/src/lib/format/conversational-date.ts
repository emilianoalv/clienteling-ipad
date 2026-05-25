/**
 * Formatea una fecha en tono conversacional, pensado para mensajes que
 * la BA manda a clientas (WhatsApp / Email / SMS) — NO para tableros.
 *
 * Distinto de `formatDateRelative` en `date.ts`: aquel usa "hace 3 días"
 * para densidad de UI; este prefiere "el lunes" / "ayer" / "la semana
 * pasada" porque suena más natural en una conversación.
 *
 * Reglas (referencia: now):
 *   0 días → "hoy"
 *   1 día  → "ayer"
 *   2-6 días → "el lunes" | "el martes" | ... (día de la semana en es-MX)
 *   7-13 días → "la semana pasada"
 *   14-30 días → "hace N semanas"
 *   31-60 días → "hace un mes"
 *   61+ días → "hace N meses"
 *
 * Solo soporta fechas pasadas (el caso para mensajes de seguimiento).
 * Para fechas futuras devuelve cadena vacía — el caller decide qué hacer.
 */

import { daysBetween } from "@/lib/date/week";

const WEEKDAYS_ES = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
] as const;

export function formatConversationalDate(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const diff = daysBetween(now, date);
  if (diff > 0) return "";

  const abs = Math.abs(diff);
  if (abs === 0) return "hoy";
  if (abs === 1) return "ayer";
  if (abs <= 6) {
    const dayName = WEEKDAYS_ES[date.getDay()] ?? "";
    return dayName ? `el ${dayName}` : "esta semana";
  }
  if (abs <= 13) return "la semana pasada";
  if (abs <= 30) {
    const weeks = Math.round(abs / 7);
    return `hace ${weeks} semanas`;
  }
  if (abs <= 60) return "hace un mes";
  const months = Math.round(abs / 30);
  return `hace ${months} meses`;
}

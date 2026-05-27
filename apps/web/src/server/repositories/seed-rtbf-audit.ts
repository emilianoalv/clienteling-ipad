import "server-only";
import type { AuditEvent, AuditEventId } from "@/types/audit-event";

/**
 * RtBF (Right-to-be-Forgotten / Derecho al olvido) audit events.
 * The ComplianceScore in features/dashboards/lib/compliance-score.ts
 * filters audit events by `/rtbf|olvido|borr|delete/i` regex against
 * the title — these entries populate that signal so the score lands
 * in the "Bueno/Atención" band (~90-94) instead of 100.
 *
 * 3 pending (<48h) + 5 completed (spread over last 60d).
 */

export const RTBF_AUDIT_EVENTS: AuditEvent[] = [
  {
    id: "au-rtbf-1" as AuditEventId,
    title: "RtBF · Solicitud de derecho al olvido — Sofía García-Linares",
    subject: "Cliente externo · sin asignación",
    actor: "Privacidad · solicitud entrante",
    at: "2026-05-25T15:12:00.000Z",
  },
  {
    id: "au-rtbf-2" as AuditEventId,
    title: "Solicitud de borrado de datos — cliente Polanco",
    subject: "Pendiente validación legal",
    actor: "Privacidad · cliente directo",
    at: "2026-05-26T20:30:00.000Z",
  },
  {
    id: "au-rtbf-3" as AuditEventId,
    title: "Derecho al olvido pendiente · validación legal en curso",
    subject: "Cliente Santa Fe",
    actor: "Privacidad · equipo legal",
    at: "2026-05-25T23:05:00.000Z",
  },
  {
    id: "au-rtbf-4" as AuditEventId,
    title: "RtBF completado · datos borrados de sistemas (<48h)",
    subject: "Cliente Perisur",
    actor: "Sistema · auditoría automática",
    at: "2026-05-19T17:00:00.000Z",
  },
  {
    id: "au-rtbf-5" as AuditEventId,
    title: "RtBF completado · datos borrados de sistemas (<48h)",
    subject: "Cliente Polanco",
    actor: "Sistema · auditoría automática",
    at: "2026-05-11T22:22:00.000Z",
  },
  {
    id: "au-rtbf-6" as AuditEventId,
    title: "Solicitud de olvido cerrada · cliente verificó identidad",
    subject: "Cliente Santa Fe",
    actor: "Privacidad · equipo legal",
    at: "2026-04-28T16:45:00.000Z",
  },
  {
    id: "au-rtbf-7" as AuditEventId,
    title: "Derecho ARCO ejercido · borrado completo procesado",
    subject: "Cliente Perisur",
    actor: "Privacidad · equipo legal",
    at: "2026-04-14T15:30:00.000Z",
  },
  {
    id: "au-rtbf-8" as AuditEventId,
    title: "RtBF · 36h resolución",
    subject: "Cliente Polanco",
    actor: "Sistema · auditoría automática",
    at: "2026-04-03T21:10:00.000Z",
  },
];

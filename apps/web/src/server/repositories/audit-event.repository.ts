import "server-only";
import type { AuditEvent, AuditEventId } from "@/types/audit-event";

const SEED: AuditEvent[] = [
  {
    id: "au-01" as AuditEventId,
    title: "Consent · revocación WhatsApp",
    subject: "Regina Iturbide",
    actor: "ba-03 · Palacio Polanco",
    at: "2026-02-08T09:22:00.000Z",
  },
  {
    id: "au-02" as AuditEventId,
    title: "Nueva clienta",
    subject: "Ximena Cortázar",
    actor: "ba-01 · Liverpool Polanco",
    at: "2025-12-14T14:10:00.000Z",
  },
  {
    id: "au-03" as AuditEventId,
    title: "Plantilla · edición",
    subject: "Cumpleaños Lancôme",
    actor: "us-04 · Admin CRM",
    at: "2026-04-12T11:02:00.000Z",
  },
  {
    id: "au-04" as AuditEventId,
    title: "Integración WhatsApp · ping",
    subject: "—",
    actor: "sistema",
    at: "2026-04-23T08:00:00.000Z",
  },
  {
    id: "au-05" as AuditEventId,
    title: "Reset de PIN",
    subject: "Camila Santos",
    actor: "us-07 · Admin · Marketing CRM",
    at: "2026-04-18T16:45:00.000Z",
  },
  {
    id: "au-06" as AuditEventId,
    title: "Acceso revocado",
    subject: "us-99 (cuenta inactiva)",
    actor: "us-08 · Admin · Operaciones Retail",
    at: "2026-04-22T10:14:00.000Z",
  },
];

export interface AuditEventRepository {
  list(): Promise<AuditEvent[]>;
}

export const auditEventRepository: AuditEventRepository = {
  async list() {
    return [...SEED].sort((a, b) => b.at.localeCompare(a.at));
  },
};

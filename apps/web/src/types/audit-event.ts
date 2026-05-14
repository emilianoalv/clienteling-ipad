import type { Branded } from "./branded";

export type AuditEventId = Branded<string, "AuditEvent">;

export interface AuditEvent {
  id: AuditEventId;
  /** Short verb describing the event (e.g. "Consent · revocación WhatsApp"). */
  title: string;
  /** Subject of the action (client name, template name, etc.). */
  subject: string;
  /** Actor identifier — "ba-03 · Palacio Polanco" / "us-04 · Admin CRM" / "sistema". */
  actor: string;
  /** ISO date-time. */
  at: string;
}

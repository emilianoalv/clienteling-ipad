import "server-only";
import type { AuditEvent } from "@/types/audit-event";
import { auditEventRepository } from "@/server/repositories/audit-event.repository";

export async function listAuditEvents(): Promise<AuditEvent[]> {
  return auditEventRepository.list();
}

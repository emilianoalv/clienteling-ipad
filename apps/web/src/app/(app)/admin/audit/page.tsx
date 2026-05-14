import { AuditLog, listAuditEvents } from "@/features/admin";
import { requireSession } from "@/server/auth/session";

export default async function AdminAuditPage() {
  await requireSession();
  const events = await listAuditEvents();
  return <AuditLog events={events} />;
}

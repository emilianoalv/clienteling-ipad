import { AdminHome, listAuditEvents, listUsers } from "@/features/admin";
import { listProducts } from "@/features/catalog";
import { storeRepository } from "@/server/repositories/store.repository";
import { templateRepository } from "@/server/repositories/template.repository";
import { requireSession } from "@/server/auth/session";

const PRIVACY_NOTICE_VERSION = "v2026.03";

export default async function AdminHomePage() {
  await requireSession();
  const [users, products, templates, auditEvents, stores] = await Promise.all([
    listUsers(),
    listProducts({}),
    templateRepository.list(),
    listAuditEvents(),
    storeRepository.list(),
  ]);
  const storeLookup = Object.fromEntries(stores.map((s) => [s.id, s.name]));

  return (
    <AdminHome
      users={users}
      products={products}
      templates={templates}
      auditEvents={auditEvents}
      privacyNoticeVersion={PRIVACY_NOTICE_VERSION}
      storeLookup={storeLookup}
    />
  );
}

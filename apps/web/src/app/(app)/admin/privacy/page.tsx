import { SectionHeader } from "@/components/patterns";
import { PrivacyNoticeScreen } from "@/features/admin/components/privacy-notice-screen";
import { requireSession } from "@/server/auth/session";
import { privacyNoticeRepository } from "@/server/repositories/privacy-notice.repository";

/**
 * /admin/privacy — versioning del aviso de privacidad. LFPDPPP requiere
 * mantener "fecha, versión y aceptación explícita" — esta página da al
 * Admin el control para publicar nuevas versiones sin redeploy y
 * preserva el histórico para auditoría.
 */
export default async function AdminPrivacyPage() {
  const { staff } = await requireSession();
  if (staff.role !== "Admin") {
    throw new Error("Esta vista solo está disponible para el rol Admin.");
  }
  const notices = await privacyNoticeRepository.list();
  return (
    <section className="flex flex-col gap-4">
      <SectionHeader title="Aviso de privacidad" eyebrow="Cumplimiento" />
      <PrivacyNoticeScreen notices={notices} />
    </section>
  );
}

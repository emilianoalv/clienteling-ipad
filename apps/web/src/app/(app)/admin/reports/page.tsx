import { SectionHeader } from "@/components/patterns";
import { ReportsScreen, listReports } from "@/features/reports";
import { requireSession } from "@/server/auth/session";
import { getT } from "@/lib/i18n/get-t";

export default async function AdminReportsPage() {
  await requireSession();
  const t = await getT();
  const reports = await listReports();
  return (
    <section className="flex flex-col gap-4">
      <SectionHeader title={t("reports.title")} eyebrow={t("rail.reports")} />
      <ReportsScreen reports={reports} />
    </section>
  );
}

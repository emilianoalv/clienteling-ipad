import { SectionHeader } from "@/components/patterns";
import { TicketsScreen, listTickets } from "@/features/tickets";
import { requireSession } from "@/server/auth/session";
import { getT } from "@/lib/i18n/get-t";

export default async function SupervisorTicketsPage() {
  await requireSession();
  const t = await getT();
  const tickets = await listTickets();
  return (
    <section className="flex flex-col gap-4">
      <SectionHeader title={t("tickets.title")} eyebrow={t("rail.tickets")} />
      <TicketsScreen tickets={tickets} />
    </section>
  );
}

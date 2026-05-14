import { notFound, redirect } from "next/navigation";
import { SectionHeader } from "@/components/patterns";
import { FollowupScreen, listTemplates } from "@/features/followup";
import { listClients } from "@/features/clients";
import { listCommunications } from "@/features/communications/server/list-communications";
import { requireSession } from "@/server/auth/session";
import { storeRepository } from "@/server/repositories/store.repository";
import { getT } from "@/lib/i18n/get-t";
import type { ClientId } from "@/types/client";
import type { StoreId } from "@/types/store";

type Tab = "composer" | "log";

export default async function FollowupPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string; tab?: string }>;
}) {
  const t = await getT();
  const { staff } = await requireSession();
  const params = await searchParams;
  const tab: Tab = params.tab === "log" ? "log" : "composer";

  const clients = await listClients({ brands: staff.brands });
  if (clients.length === 0) notFound();

  const requestedId = params.clientId?.trim();
  const matched = requestedId ? clients.find((c) => c.id === requestedId) : undefined;
  const client = matched ?? clients[0]!;

  if (!matched) {
    redirect(`/ba/followup?clientId=${client.id}${tab === "log" ? "&tab=log" : ""}`);
  }

  const [templates, communications, store] = await Promise.all([
    listTemplates({ brands: staff.brands }),
    listCommunications({ brands: staff.brands }),
    "storeId" in staff ? storeRepository.findById(staff.storeId as StoreId) : Promise.resolve(null),
  ]);

  const clientLookup = Object.fromEntries(clients.map((c) => [c.id, c.name])) as Record<
    ClientId,
    string
  >;

  return (
    <section className="flex flex-col gap-4">
      <SectionHeader title={t("followup.title")} eyebrow={t("rail.followup")} />
      <FollowupScreen
        tab={tab}
        client={client}
        templates={templates}
        staffName={staff.name}
        storeName={store?.name ?? "—"}
        communications={communications}
        clientLookup={clientLookup}
      />
    </section>
  );
}

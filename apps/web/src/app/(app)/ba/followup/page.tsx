import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FollowupScreen, listTemplates } from "@/features/followup";
import { listClients } from "@/features/clients";
import { TaskInbox } from "@/features/clients/components/task-inbox";
import { listCommunications } from "@/features/communications/server/list-communications";
import { requireSession } from "@/server/auth/session";
import { brandScopeFor, homeStoreFor, storeScopeFor } from "@/server/auth/scope";
import { storeRepository } from "@/server/repositories/store.repository";
import { followupTaskRepository } from "@/server/repositories/followup-task.repository";
import { cn } from "@/lib/cn";
import type { ClientId } from "@/types/client";

type View = "tasks" | "messages";
type InnerTab = "composer" | "log";

export default async function FollowupPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; clientId?: string; tab?: string }>;
}) {
  const { staff } = await requireSession();
  const params = await searchParams;
  const view: View = params.view === "messages" ? "messages" : "tasks";

  const storeIds = storeScopeFor(staff);
  const brands = brandScopeFor(staff);

  // Always-loaded: clients (used by both views for name lookup).
  const clients = await listClients({ brands, storeIds });
  if (clients.length === 0) notFound();

  const clientLookup = Object.fromEntries(clients.map((c) => [c.id, c.name])) as Record<
    string,
    string
  >;

  if (view === "tasks") {
    const tasks = await followupTaskRepository.listByBA(staff.id);
    return (
      <section className="flex flex-col gap-4">
        <Tabs active="tasks" clientId={clients[0]!.id} />
        <TaskInbox tasks={tasks} clientLookup={clientLookup} />
      </section>
    );
  }

  // view === "messages" — keep the legacy composer + log flow.
  const innerTab: InnerTab = params.tab === "log" ? "log" : "composer";
  const requestedId = params.clientId?.trim();
  const matched = requestedId ? clients.find((c) => c.id === requestedId) : undefined;
  const client = matched ?? clients[0]!;

  if (!matched) {
    redirect(
      `/ba/followup?view=messages&clientId=${client.id}${innerTab === "log" ? "&tab=log" : ""}`,
    );
  }

  const homeStore = homeStoreFor(staff);
  const [templates, communications, store] = await Promise.all([
    listTemplates({ brands }),
    listCommunications({ brands, storeIds }),
    homeStore ? storeRepository.findById(homeStore) : Promise.resolve(null),
  ]);

  return (
    <section className="flex flex-col gap-4">
      <Tabs active="messages" clientId={client.id} />
      <FollowupScreen
        tab={innerTab}
        client={client}
        templates={templates}
        staffName={staff.name}
        storeName={store?.name ?? "—"}
        communications={communications}
        clientLookup={clientLookup as Record<ClientId, string>}
      />
    </section>
  );
}

function Tabs({ active, clientId }: { active: View; clientId: string }) {
  return (
    <nav aria-label="Seguim. views" className="flex gap-0 border-b border-line">
      <TabLink href="/ba/followup" active={active === "tasks"}>
        Tareas
      </TabLink>
      <TabLink
        href={`/ba/followup?view=messages&clientId=${clientId}`}
        active={active === "messages"}
      >
        Comunicaciones
      </TabLink>
    </nav>
  );
}

function TabLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "relative px-4 py-2.5 text-[15px] font-semibold leading-none text-ink no-underline cursor-pointer",
        active
          ? "after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:bg-ink"
          : "text-ink/60 hover:text-ink",
      )}
    >
      {children}
    </Link>
  );
}

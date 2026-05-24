import Link from "next/link";
import { getT } from "@/lib/i18n/get-t";
import type { Client } from "@/types/client";
import type { Communication } from "@/types/communication";
import type { FollowupTask } from "@/types/followup-task";
import type { Template } from "@/types/template";
import { Composer } from "./composer";
import { CommLog, CommMetrics } from "@/features/communications";

type Tab = "composer" | "log";

export interface FollowupScreenProps {
  tab: Tab;
  client: Client;
  templates: readonly Template[];
  staffName: string;
  storeName: string;
  communications: readonly Communication[];
  clientLookup: Readonly<Record<string, string>>;
  /** Task que originó el composer (deep link desde inbox). Opcional. */
  task?: FollowupTask | null;
}

export async function FollowupScreen({
  tab,
  client,
  templates,
  staffName,
  storeName,
  communications,
  clientLookup,
  task,
}: FollowupScreenProps) {
  const t = await getT();

  return (
    <div className="flex flex-col gap-4">
      <nav aria-label="Followup tabs" className="flex gap-0 border-b border-line">
        <TabLink href={`/ba/followup?clientId=${client.id}`} active={tab === "composer"}>
          {t("followup.tab.composer")}
        </TabLink>
        <TabLink
          href={`/ba/followup?clientId=${client.id}&tab=log`}
          active={tab === "log"}
        >
          {t("followup.tab.log")}
        </TabLink>
      </nav>

      {tab === "composer" ? (
        <Composer
          client={client}
          templates={templates}
          staffName={staffName}
          storeName={storeName}
          task={task ?? null}
        />
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
          <CommLog
            communications={communications}
            clientLookup={clientLookup}
            title={t("followup.log.title")}
            eyebrow={t("followup.log.eyebrow")}
          />
          <CommMetrics communications={communications} />
        </div>
      )}
    </div>
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
      aria-current={active ? "page" : undefined}
      className={`px-5 py-3.5 text-[16px] font-medium no-underline border-b-2 transition-colors ${
        active
          ? "border-ink text-ink font-semibold"
          : "border-transparent text-ink/60 hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import type { Appointment } from "@/types/appointment";
import type { Client, ClientId } from "@/types/client";
import type { Interaction } from "@/types/interaction";
import type { Purchase } from "@/types/purchase";
import type { Sample } from "@/types/sample";
import type { Product } from "@/types/product";
import type { Recommendation } from "@/types/recommendation";
import type { Communication } from "@/types/communication";
import type { FollowupTask } from "@/types/followup-task";
import type { Template } from "@/types/template";
import { Card } from "@/components/patterns";
import { cn } from "@/lib/cn";
import { PurchasesPreview } from "./tabs/purchases-preview";
import { SamplesPreview } from "./tabs/samples-preview";
import { RecsPreview } from "./tabs/recs-preview";
import { AppointmentsPreview } from "./tabs/appointments-preview";
import { FollowupTab } from "./tabs/followup-tab";
import { MessagesTab } from "./tabs/messages-tab";
import { BeautyProfileTab } from "./beauty-profile-tab";

type TabId =
  | "purchases"
  | "recs"
  | "samples"
  | "appointments"
  | "beauty"
  | "msgs"
  | "followup";

const TAB_PARAM_VALUES: ReadonlySet<TabId> = new Set([
  "purchases",
  "recs",
  "samples",
  "appointments",
  "beauty",
  "msgs",
  "followup",
]);

export interface ClientProfileTabsProps {
  client: Client;
  interactions: readonly Interaction[];
  purchases: readonly Purchase[];
  samples: readonly Sample[];
  recommendations: readonly Recommendation[];
  appointments: readonly Appointment[];
  communications: readonly Communication[];
  followupTasks: readonly FollowupTask[];
  /** BA name lookup by staffId — used to label appointments by BA. */
  baLookup: Record<string, string>;
  /** SKU → Product. Used by recs/samples previews to render real names. */
  productBySku: Record<string, Product>;
  /** Templates filtered by BA brand scope — used by Mensajes tab composer. */
  templates: readonly Template[];
  /** BA's store name — used by Mensajes tab composer to render templates. */
  storeName: string;
  /** BA's own display name — used by Mensajes tab composer signature. */
  staffName: string;
  clientName: string;
  clientId: string;
}

export function ClientProfileTabs(props: ClientProfileTabsProps) {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<TabId>("purchases");

  // Allow deep-links like ?tab=followup (used by the Seguimiento action strip button).
  useEffect(() => {
    const requested = searchParams.get("tab");
    if (requested && TAB_PARAM_VALUES.has(requested as TabId)) {
      setTab(requested as TabId);
    }
  }, [searchParams]);

  const tabs: ReadonlyArray<{ id: TabId; label: string }> = [
    { id: "purchases", label: t("profile.tab.purchases") },
    { id: "recs", label: t("profile.tab.recs") },
    { id: "samples", label: t("profile.tab.samples") },
    { id: "appointments", label: "Citas" },
    { id: "beauty", label: "Perfil de belleza" },
    { id: "followup", label: "Seguimientos" },
    { id: "msgs", label: t("profile.tab.msgs") },
  ];

  return (
    <div id="profile-tabs">
      <div role="tablist" className="inline-flex gap-1 border-b border-line mb-4">
        {tabs.map((definition) => {
          const active = tab === definition.id;
          return (
            <button
              key={definition.id}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => setTab(definition.id)}
              className={cn(
                "relative border-0 bg-transparent px-3 py-2 text-[16px] font-semibold leading-none cursor-pointer",
                active
                  ? "text-ink after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:bg-ink"
                  : "text-ink/60 hover:text-ink",
              )}
            >
              {definition.label}
            </button>
          );
        })}
      </div>

      <Card variant="flat" className="min-h-[220px]" role="tabpanel">
        {tab === "purchases" && (
          <PurchasesPreview purchases={props.purchases} clientId={props.clientId} />
        )}
        {tab === "recs" && (
          <RecsPreview
            recommendations={props.recommendations}
            clientId={props.clientId}
            productBySku={props.productBySku}
          />
        )}
        {tab === "samples" && (
          <SamplesPreview samples={props.samples} clientId={props.clientId} />
        )}
        {tab === "appointments" && (
          <AppointmentsPreview
            appointments={props.appointments}
            clientId={props.clientId}
            baLookup={props.baLookup}
          />
        )}
        {tab === "beauty" && <BeautyProfileTab client={props.client} />}
        {tab === "followup" && (
          <FollowupTab clientId={props.clientId as ClientId} tasks={props.followupTasks} />
        )}
        {tab === "msgs" && (
          <MessagesTab
            client={props.client}
            communications={props.communications}
            templates={props.templates}
            staffName={props.staffName}
            storeName={props.storeName}
          />
        )}
      </Card>
    </div>
  );
}

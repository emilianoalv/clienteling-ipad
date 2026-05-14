"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Interaction } from "@/types/interaction";
import type { Purchase } from "@/types/purchase";
import type { Sample } from "@/types/sample";
import type { Recommendation } from "@/types/recommendation";
import type { Consent } from "@/types/consent";
import type { Communication } from "@/types/communication";
import { Card } from "@/components/patterns";
import { cn } from "@/lib/cn";
import { PurchasesPreview } from "./tabs/purchases-preview";
import { SamplesPreview } from "./tabs/samples-preview";
import { RecsPreview } from "./tabs/recs-preview";
import { ConsentPreview } from "./tabs/consent-preview";
import { CommLog } from "@/features/communications";

type TabId = "purchases" | "recs" | "samples" | "msgs" | "consent";

export interface ClientProfileTabsProps {
  interactions: readonly Interaction[];
  purchases: readonly Purchase[];
  samples: readonly Sample[];
  recommendations: readonly Recommendation[];
  consents: readonly Consent[];
  communications: readonly Communication[];
  clientName: string;
  clientId: string;
}

export function ClientProfileTabs(props: ClientProfileTabsProps) {
  const t = useTranslations();
  const [tab, setTab] = useState<TabId>("purchases");

  const tabs: ReadonlyArray<{ id: TabId; labelKey: string }> = [
    { id: "purchases", labelKey: "profile.tab.purchases" },
    { id: "recs", labelKey: "profile.tab.recs" },
    { id: "samples", labelKey: "profile.tab.samples" },
    { id: "msgs", labelKey: "profile.tab.msgs" },
    { id: "consent", labelKey: "profile.tab.consent" },
  ];

  return (
    <div>
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
              {t(definition.labelKey as Parameters<typeof t>[0])}
            </button>
          );
        })}
      </div>

      <Card variant="flat" className="min-h-[220px]" role="tabpanel">
        {tab === "purchases" && (
          <PurchasesPreview purchases={props.purchases} clientId={props.clientId} />
        )}
        {tab === "recs" && <RecsPreview recommendations={props.recommendations} />}
        {tab === "samples" && <SamplesPreview samples={props.samples} />}
        {tab === "msgs" && (
          <CommLog
            communications={props.communications}
            clientLookup={{ [props.communications[0]?.clientId ?? ""]: props.clientName }}
            compact
          />
        )}
        {tab === "consent" && <ConsentPreview consents={props.consents} />}
      </Card>
    </div>
  );
}

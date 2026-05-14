"use client";

import { useTranslations } from "next-intl";
import type { Client } from "@/types/client";
import { Card } from "@/components/patterns";
import { formatCurrency } from "@/lib/format/format-currency";

export function ClientInsightsCard({ client }: { client: Client }) {
  const t = useTranslations();
  const stats = client.stats;

  return (
    <Card>
      <span className="text-[15px] font-semibold tracking-[0.12em] uppercase text-ink/60">
        {t("appointment.insights.title")}
      </span>
      <div className="grid grid-cols-2 gap-2.5 mt-2.5">
        <InsightCell label={t("appointment.insights.visits")} value={String(stats.visits)} mono />
        <InsightCell
          label={t("appointment.insights.avg_ticket")}
          value={formatCurrency(stats.avgTicket)}
          mono
        />
        <InsightCell label={t("appointment.insights.ltv")} value={formatCurrency(stats.ltv)} mono />
        <InsightCell label={t("appointment.insights.tier")} value={client.tier} />
      </div>
    </Card>
  );
}

function InsightCell({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[14px] font-medium leading-snug text-ink/60">{label}</div>
      <div
        className={
          mono
            ? "text-[18px] font-semibold leading-tight tabular"
            : "text-[16px] font-semibold leading-tight"
        }
      >
        {value}
      </div>
    </div>
  );
}

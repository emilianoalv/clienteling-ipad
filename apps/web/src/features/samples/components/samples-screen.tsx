"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { Sample } from "@/types/sample";
import type { Purchase } from "@/types/purchase";
import type { SampleInventoryItem } from "@/server/repositories/sample.repository";
import { Avatar, BrandTag, Button, Chip, ProgressBar } from "@/components/primitives";
import { Card, KpiCard, SectionHeader } from "@/components/patterns";
import { aggregateSampleStats } from "../services/sample-stats";

export interface SamplesScreenProps {
  samples: readonly Sample[];
  purchases: readonly Purchase[];
  inventory: readonly SampleInventoryItem[];
  clientLookup: Readonly<Record<string, string>>;
}

export function SamplesScreen({
  samples,
  purchases,
  inventory,
  clientLookup,
}: SamplesScreenProps) {
  const t = useTranslations();
  const stats = aggregateSampleStats(samples, purchases, { windowDays: 7 });

  return (
    <div className="grid grid-cols-[1.3fr_1fr] gap-6 items-start">
      <Card variant="luxe" className="flex flex-col gap-4">
        <header>
          <span className="text-[15px] font-semibold tracking-[0.12em] uppercase text-ink/60">
            {t("samples.title")}
          </span>
          <h2 className="m-0 font-display text-[28px] leading-tight tracking-[-0.005em]">
            {t("samples.delivered_this_week")}
          </h2>
        </header>

        <div className="grid grid-cols-2 gap-3">
          <KpiCard
            label={t("samples.kpi.delivered")}
            value={String(stats.delivered)}
            size="sm"
          />
          <KpiCard
            label={t("samples.kpi.conversion_rate")}
            value={`${Math.round(stats.conversionRate * 100)}%`}
            size="sm"
          />
        </div>

        <hr className="border-0 border-t border-line m-0" />

        {samples.length === 0 ? (
          <p className="m-0 px-2 py-6 text-center text-[16px] font-medium text-ink/60">
            {t("samples.empty")}
          </p>
        ) : (
          <ul className="list-none m-0 p-0">
            {samples.map((s) => {
              const clientName = clientLookup[s.clientId] ?? t("samples.unknown_client");
              return (
                <li
                  key={s.id}
                  className="grid grid-cols-[40px_1fr_1.4fr_auto_auto] gap-3 items-center py-3 border-b border-line last:border-b-0"
                >
                  <Avatar initials={initials(clientName)} size={36} />
                  <div className="min-w-0">
                    <div className="text-[16px] font-semibold leading-tight truncate">
                      {clientName}
                    </div>
                    <div className="text-[15px] font-medium leading-snug text-ink/60 truncate">
                      {s.name}
                    </div>
                  </div>
                  <div className="text-[15px] font-medium leading-snug text-ink/60">
                    {t("samples.delivered_on", { date: formatDate(s.givenAt) })}
                    {s.followUpAt ? (
                      <>
                        {" · "}
                        {t("samples.followup_on", { date: formatDate(s.followUpAt) })}
                      </>
                    ) : null}
                  </div>
                  <Chip variant={s.converted ? "ok" : "warn"} size="sm">
                    {s.converted ? t("samples.status.converted") : t("samples.status.pending")}
                  </Chip>
                  <Link href={`/ba/clients/${s.clientId}`}>
                    <Button variant="ghost" size="sm">
                      {t("samples.follow")}
                    </Button>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card className="self-start sticky top-4 flex flex-col gap-3">
        <SectionHeader title={t("samples.inventory.title")} eyebrow={t("samples.inventory.eyebrow")} />
        <ul className="list-none m-0 p-0 flex flex-col gap-3.5">
          {inventory.map((row) => {
            const ratio = row.capacity > 0 ? row.have / row.capacity : 0;
            const tone = ratio < 0.2 ? "danger" : "neutral";
            return (
              <li key={row.sku} className="border-b border-dashed border-line pb-3 last:border-b-0">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="inline-flex items-center gap-2 min-w-0">
                    <BrandTag brand={row.brand} alwaysShow />
                    <span className="text-[16px] font-medium leading-tight truncate">
                      {row.name}
                    </span>
                  </div>
                  <span className="text-[15px] font-medium tabular">
                    {row.have}/{row.capacity}
                  </span>
                </div>
                <ProgressBar value={ratio} tone={tone} ariaLabel={`${row.have}/${row.capacity}`} />
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0] ?? "")
    .join("")
    .toUpperCase();
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short" }).format(
      new Date(iso),
    );
  } catch {
    return iso;
  }
}

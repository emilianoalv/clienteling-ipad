"use client";

import { useTranslations } from "next-intl";
import type { BrandId } from "@/types/brand";

export interface AppointmentSummaryCardProps {
  clientName: string | null;
  kindLabel: string;
  brand: BrandId;
  baLabel: string;
  date: string;
  time: string;
  durationMin: number;
}

export function AppointmentSummaryCard({
  clientName,
  kindLabel,
  brand,
  baLabel,
  date,
  time,
  durationMin,
}: AppointmentSummaryCardProps) {
  const t = useTranslations();
  const nameColor = brand === "YSL" ? "text-ysl-gold" : "text-paper";

  const rows: ReadonlyArray<[string, string]> = [
    [t("appointment.field.kind"), kindLabel],
    [t("appointment.field.date"), date || "—"],
    [t("appointment.field.time"), time || "—"],
    [t("appointment.field.duration"), `${durationMin} min`],
    [t("appointment.field.ba"), baLabel],
    [t("appointment.field.brand"), brand],
  ];

  return (
    <section className="rounded-xl bg-ink text-paper p-6 shadow-lift-lg">
      <span className="text-[15px] font-semibold tracking-[0.12em] uppercase text-paper/55">
        {t("appointment.summary")}
      </span>
      <div className={`font-display text-[24px] leading-tight tracking-[-0.01em] mt-1 ${nameColor}`}>
        {clientName ?? t("appointment.summary_empty")}
      </div>
      <dl className="m-0 mt-4 flex flex-col">
        {rows.map(([k, v]) => (
          <div
            key={k}
            className="grid grid-cols-[1fr_auto] gap-3 items-baseline py-2.5 border-b border-paper/10 last:border-b-0"
          >
            <dt className="text-[16px] font-medium leading-snug text-paper/55">{k}</dt>
            <dd className="m-0 text-[16px] font-semibold leading-snug text-paper">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

"use client";

import { useMemo } from "react";
import { useT } from "@/lib/i18n/use-t";
import type { Channel, Communication } from "@/types/communication";
import { Card, KpiCard, SectionHeader } from "@/components/patterns";
import { ProgressBar } from "@/components/primitives";
import { aggregateCommStats } from "../services/comm-stats";

const CHANNELS: readonly Channel[] = ["WhatsApp", "Email", "SMS"];

export interface CommMetricsProps {
  communications: readonly Communication[];
}

export function CommMetrics({ communications }: CommMetricsProps) {
  const t = useT();
  const stats = useMemo(() => aggregateCommStats(communications), [communications]);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <SectionHeader size="inline" title={t("comm.metrics.title")} eyebrow={t("comm.metrics.eyebrow")} />
        <div className="grid grid-cols-2 gap-3">
          <KpiCard label={t("comm.metrics.sent")} value={String(stats.sent)} size="sm" />
          <KpiCard
            label={t("comm.metrics.read_rate")}
            value={`${Math.round(stats.readRate * 100)}%`}
            size="sm"
          />
          <KpiCard label={t("comm.metrics.responses")} value={String(stats.responded)} size="sm" />
          <KpiCard label={t("comm.metrics.opt_outs")} value={String(stats.optOuts)} size="sm" />
        </div>
      </Card>
      <Card>
        <SectionHeader size="inline" title={t("comm.channel_mix.title")} />
        <ul className="list-none m-0 p-0 flex flex-col gap-3">
          {CHANNELS.map((ch) => {
            const ratio = stats.channelMix[ch];
            return (
              <li key={ch}>
                <div className="flex justify-between text-[16px] mb-1">
                  <span className="font-semibold">{ch}</span>
                  <span className="tabular">{Math.round(ratio * 100)}%</span>
                </div>
                <ProgressBar value={ratio} ariaLabel={`${ch} ${Math.round(ratio * 100)}%`} />
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}

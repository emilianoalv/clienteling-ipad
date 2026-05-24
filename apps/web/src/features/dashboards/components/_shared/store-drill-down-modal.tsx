"use client";

import { useState } from "react";
import { Sparkline } from "@/components/charts";
import { Button } from "@/components/primitives";
import { Modal } from "@/components/feedback/modal";
import { PreviewDialog } from "@/components/feedback/preview-dialog";
import { cn } from "@/lib/cn";
import {
  formatCount,
  formatCurrencyCompact,
  formatPercent,
} from "@/lib/format/number";
import type {
  BaRankingEntry,
  OperationalAlert,
} from "../../server/queries";
import type { StoreHealth } from "../../lib/store-health";
import { AlertCard, type Severity } from "./alert-card";

export interface StoreDrillDownData {
  storeName: string;
  health: StoreHealth;
  sales: { current: number; target: number };
  yoy?: number;
  baRanking: readonly BaRankingEntry[];
  sparklineValues: readonly number[];
  alerts: readonly OperationalAlert[];
}

export interface StoreDrillDownModalProps {
  open: boolean;
  onClose: () => void;
  data: StoreDrillDownData | null;
}

export function StoreDrillDownModal({
  open,
  onClose,
  data,
}: StoreDrillDownModalProps) {
  const [previewOpen, setPreviewOpen] = useState(false);

  if (!data) return null;
  const ratioPct =
    data.sales.target > 0
      ? Math.round((data.sales.current / data.sales.target) * 100)
      : null;

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={data.storeName}
        description={`Health Score ${data.health.score} / 100 · ${data.health.grade.toUpperCase()}`}
        size="lg"
        footer={
          <>
            <Button variant="default" size="sm" onClick={onClose}>
              Cerrar
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setPreviewOpen(true)}
            >
              Programar visita
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-5">
          <section>
            <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60 mb-2">
              Desglose del score
            </div>
            <ul className="list-none m-0 p-0 grid grid-cols-2 gap-3">
              <BreakdownRow
                label="% objetivo"
                value={data.health.breakdown.targetCompletion}
              />
              <BreakdownRow
                label="Adopción BAs"
                value={data.health.breakdown.baAdoption}
              />
              <BreakdownRow
                label="Alertas (100 − 10×crit)"
                value={data.health.breakdown.alertsScore}
              />
              <BreakdownRow
                label="Uso app (proxy)"
                value={data.health.breakdown.interactionRate}
              />
            </ul>
          </section>

          <section>
            <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60 mb-2">
              KPIs principales
            </div>
            <ul className="list-none m-0 p-0 grid grid-cols-3 gap-3">
              <KpiTile
                label="Ventas"
                value={formatCurrencyCompact(data.sales.current)}
              />
              <KpiTile
                label="% objetivo"
                value={ratioPct === null ? "—" : `${ratioPct}%`}
              />
              <KpiTile
                label="YoY"
                value={
                  data.yoy === undefined
                    ? "—"
                    : `${data.yoy >= 0 ? "+" : ""}${data.yoy.toFixed(1)}%`
                }
              />
            </ul>
          </section>

          <section>
            <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60 mb-2">
              Tendencia 30 días
            </div>
            {data.sparklineValues.length >= 2 ? (
              <Sparkline values={data.sparklineValues} width={460} height={64} />
            ) : (
              <p className="m-0 text-[15px] text-ink/60">
                Aún no hay suficientes datos para una tendencia.
              </p>
            )}
          </section>

          <section>
            <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60 mb-2">
              BAs en esta tienda
            </div>
            {data.baRanking.length === 0 ? (
              <p className="m-0 text-[15px] text-ink/60">
                Sin BAs asignados.
              </p>
            ) : (
              <ul className="list-none m-0 p-0 divide-y divide-line">
                {data.baRanking.map((ba) => (
                  <li
                    key={ba.baId}
                    className="grid grid-cols-[1.4fr_0.6fr_1fr_0.8fr] gap-3 py-2 text-[15px]"
                  >
                    <span>{ba.name}</span>
                    <span className="text-ink/60">{ba.brand}</span>
                    <span className="font-semibold tabular">
                      {formatCurrencyCompact(ba.salesAmount)}
                    </span>
                    <span className="tabular">
                      {formatPercent(ba.conversionRate)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60 mb-2">
              Alertas recientes
            </div>
            {data.alerts.length === 0 ? (
              <p className="m-0 text-[15px] text-ink/60">
                Sin alertas activas para esta tienda.
              </p>
            ) : (
              <ul className="list-none m-0 p-0 grid gap-2">
                {data.alerts.slice(0, 3).map((a) => (
                  <li key={a.id}>
                    <AlertCard
                      severity={a.severity as Severity}
                      title={a.title}
                      description={a.description}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </Modal>

      <PreviewDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        feature="agenda de visitas a tienda"
      />
    </>
  );
}

function KpiTile({ label, value }: { label: string; value: string }) {
  return (
    <li className="border border-line rounded-md p-3 flex flex-col gap-1 bg-paper">
      <span className="text-[13px] font-semibold tracking-[0.12em] uppercase text-ink/60">
        {label}
      </span>
      <span className="font-display text-[20px] leading-none tabular">
        {value}
      </span>
    </li>
  );
}

function BreakdownRow({ label, value }: { label: string; value: number }) {
  const tone = value >= 80 ? "bg-ok" : value >= 60 ? "bg-warn" : "bg-err";
  return (
    <li className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2 text-[15px]">
        <span className="text-ink/60">{label}</span>
        <span className="font-semibold tabular">{formatCount(value)}</span>
      </div>
      <div className="h-1.5 rounded-full bg-ink/[0.06] overflow-hidden">
        <div
          className={cn("h-full", tone)}
          style={{ width: `${Math.max(2, value)}%` }}
        />
      </div>
    </li>
  );
}

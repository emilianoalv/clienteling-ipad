"use client";

import { useState } from "react";
import { Sparkline } from "@/components/charts";
import { Button } from "@/components/primitives";
import { Modal } from "@/components/feedback/modal";
import { PreviewDialog } from "@/components/feedback/preview-dialog";
import { formatCurrencyCompact, formatPercent } from "@/lib/format/number";
import type { BaRankingEntry, OperationalAlert } from "../../server/queries";
import { AlertCard, type Severity } from "./alert-card";

export interface BaDrillDownData {
  entry: BaRankingEntry;
  /** Target for the BA — 0/undefined hides the % goal row. */
  monthlyTarget: number;
  /** % growth vs prior period; positive = good. */
  growthPct: number;
  /** Daily sales values for a small sparkline (30d). */
  sparklineValues: readonly number[];
  /** Alerts already filtered to this BA. */
  alerts: readonly OperationalAlert[];
}

export interface BADrillDownModalProps {
  open: boolean;
  onClose: () => void;
  data: BaDrillDownData | null;
}

/**
 * Drill-down modal triggered by clicking a row in the BA ranking. Shows the
 * BA's headline KPIs, a 30d trend, and the 3 most-recent operational alerts.
 * The "Programar 1:1" CTA opens a PreviewDialog because the calendar wiring
 * is out of scope for Etapa 2.
 */
export function BADrillDownModal({ open, onClose, data }: BADrillDownModalProps) {
  const [previewOpen, setPreviewOpen] = useState(false);

  if (!data) return null;
  const { entry, monthlyTarget, growthPct, sparklineValues, alerts } = data;
  const ratioPct =
    monthlyTarget > 0
      ? Math.round((entry.salesAmount / monthlyTarget) * 100)
      : null;

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={entry.name}
        description={`${entry.brand} · ${entry.storeName}`}
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
              Programar 1:1
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-5">
          <ul className="list-none m-0 p-0 grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiTile label="Ventas" value={formatCurrencyCompact(entry.salesAmount)} />
            {ratioPct !== null ? (
              <KpiTile label="% objetivo" value={`${ratioPct}%`} />
            ) : null}
            <KpiTile label="Transacciones" value={`${entry.transactionsCount}`} />
            <KpiTile
              label="Conv reco→compra"
              value={formatPercent(entry.conversionRate)}
            />
            <KpiTile label="Ranking" value={`#${entry.rank}`} />
            <KpiTile
              label="Crecimiento"
              value={`${growthPct >= 0 ? "+" : ""}${growthPct.toFixed(1)}%`}
            />
          </ul>

          <section>
            <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60 mb-2">
              Tendencia 30 días
            </div>
            {sparklineValues.length >= 2 ? (
              <Sparkline values={sparklineValues} width={460} height={64} />
            ) : (
              <p className="m-0 text-[15px] text-ink/60">
                Aún no hay suficientes datos para una tendencia.
              </p>
            )}
          </section>

          <section>
            <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60 mb-2">
              Alertas recientes
            </div>
            {alerts.length === 0 ? (
              <p className="m-0 text-[15px] text-ink/60">
                Sin alertas activas para este BA.
              </p>
            ) : (
              <ul className="list-none m-0 p-0 grid gap-2">
                {alerts.slice(0, 3).map((a) => (
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
        feature="agenda de 1:1 con BAs"
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
      <span className="font-display text-[22px] leading-none tabular">{value}</span>
    </li>
  );
}

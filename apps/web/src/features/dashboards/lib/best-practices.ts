import type { StoreId } from "@/types/store";

/**
 * Cross-store comparison that detects which store leads on a given metric
 * and emits an actionable insight when the gap is > 15%. Spec §3.3 Sec 3.
 */

export type BestPracticeMetric =
  | "convReco"
  | "convSample"
  | "avgTicket"
  | "newClientsPerDay"
  | "adoption";

export interface StoreMetricsSnapshot {
  convReco: number; // 0-100
  convSample: number; // 0-100
  avgTicket: number; // MXN
  newClientsPerDay: number; // count / day
  adoption: number; // 0-100
}

export interface BestPracticeInsight {
  winnerStore: string;
  loserStore: string;
  metric: BestPracticeMetric;
  metricLabel: string;
  differencePercent: number;
  suggestion: string;
}

const METRIC_LABELS: Record<BestPracticeMetric, string> = {
  convReco: "conversión reco→compra",
  convSample: "conversión sample→compra",
  avgTicket: "ticket promedio",
  newClientsPerDay: "perfiles nuevos por día",
  adoption: "adopción de la app",
};

const SUGGESTIONS: Record<BestPracticeMetric, (winner: string, loser: string) => string> = {
  convReco: (w, l) =>
    `Considera transferir el approach del counter de ${w} a ${l}.`,
  convSample: (w, l) =>
    `El método de seguimiento post-sample de ${w} puede replicarse en ${l}.`,
  avgTicket: (w, l) =>
    `Revisa el cross-sell que hace el equipo de ${w} y comparte con ${l}.`,
  newClientsPerDay: (w) =>
    `Pregunta a la gerencia de ${w} qué método usa al onboarding de clientas.`,
  adoption: (w, l) =>
    `El uso consistente de la app en ${w} debería replicarse en ${l}.`,
};

const METRICS: readonly BestPracticeMetric[] = [
  "convReco",
  "convSample",
  "avgTicket",
  "newClientsPerDay",
  "adoption",
];

/**
 * Returns up to 3 insights ordered by the size of the gap (largest first).
 * Only emits when the gap is > 15% of the loser's value AND the loser is > 0.
 */
export function computeBestPractices(
  storeMetrics: ReadonlyMap<StoreId, StoreMetricsSnapshot>,
  storeNamesById: ReadonlyMap<StoreId, string>,
): BestPracticeInsight[] {
  const stores = Array.from(storeMetrics.entries());
  if (stores.length < 2) return [];

  const insights: BestPracticeInsight[] = [];

  for (const metric of METRICS) {
    const sorted = [...stores].sort(
      (a, b) => b[1][metric] - a[1][metric],
    );
    const [winnerEntry] = sorted;
    const loserEntry = sorted[sorted.length - 1];
    if (!winnerEntry || !loserEntry) continue;
    const [winnerId, winnerStats] = winnerEntry;
    const [loserId, loserStats] = loserEntry;
    if (winnerId === loserId) continue;
    const winnerVal = winnerStats[metric];
    const loserVal = loserStats[metric];
    if (loserVal <= 0) continue;
    const diffPct = ((winnerVal - loserVal) / loserVal) * 100;
    if (diffPct <= 15) continue;

    const winnerName = storeNamesById.get(winnerId) ?? "tienda destacada";
    const loserName = storeNamesById.get(loserId) ?? "otra tienda";

    insights.push({
      winnerStore: winnerName,
      loserStore: loserName,
      metric,
      metricLabel: METRIC_LABELS[metric],
      differencePercent: Math.round(diffPct),
      suggestion: SUGGESTIONS[metric](winnerName, loserName),
    });
  }

  return insights
    .sort((a, b) => b.differencePercent - a.differencePercent)
    .slice(0, 3);
}

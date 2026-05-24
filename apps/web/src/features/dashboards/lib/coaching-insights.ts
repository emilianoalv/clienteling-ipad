import type { BrandId } from "@/types/brand";
import type { StaffId } from "@/types/staff";
import {
  formatPercent,
  formatPercentChange,
  formatPercentDelta,
} from "@/lib/format/number";
import type { BaRankingEntry } from "../server/queries";
import type { BrandCounterAverages } from "./counter-averages";

export type InsightSeverity = "info" | "warning" | "critical";

export interface CoachingInsight {
  severity: InsightSeverity;
  title: string;
  description: string;
}

export interface CoachingInputs {
  ranking: readonly BaRankingEntry[];
  /** % growth (e.g. +12.4) vs previous comparable period, keyed by `baId`. */
  deltas: ReadonlyMap<StaffId, number>;
  /** Per-brand counter averages (sales + conversion). */
  counterAveragesByBrand: ReadonlyMap<BrandId, BrandCounterAverages>;
  /** Monthly target per BA, keyed by `baId`. Missing entry = no target. */
  targetsByBa: ReadonlyMap<StaffId, number>;
}

/**
 * Derive up to 3 coaching insights from the BA ranking + deltas + targets.
 *
 * Spec §3.2 §3.3 algorithm (in order of priority):
 *   1. Top growth — celebrate the highest positive delta.
 *   2. Lowest conv vs counter — flag the worst conversion gap.
 *   3. Lowest % of target — escalate the BA furthest from goal.
 *
 * Each insight references a *different* BA when possible; if the worst
 * performer also has the worst conversion we surface them once with the
 * higher-severity message (target-gap wins over conv-gap).
 */
export function computeCoachingInsights(
  inputs: CoachingInputs,
): CoachingInsight[] {
  const out: CoachingInsight[] = [];
  const used = new Set<StaffId>();

  const topGrowth = pickTopGrowth(inputs.ranking, inputs.deltas);
  if (topGrowth) {
    out.push({
      severity: "info",
      title: `${topGrowth.name} creció ${formatPercentChange(topGrowth.delta)} vs período anterior`,
      description: "Reconócelo en tu 1:1 — el patrón vale replicarlo.",
    });
    used.add(topGrowth.baId);
  }

  const lowGoal = pickLowestGoal(
    inputs.ranking,
    inputs.targetsByBa,
    used,
  );
  if (lowGoal) {
    const ratioPct = Math.round(lowGoal.ratio * 100);
    const severity: InsightSeverity = ratioPct < 70 ? "critical" : "warning";
    out.push({
      severity,
      title: `${lowGoal.name} está al ${formatPercent(ratioPct)} del objetivo`,
      description:
        severity === "critical"
          ? "Necesita atención urgente esta semana."
          : "Conviene un seguimiento esta semana.",
    });
    used.add(lowGoal.baId);
  }

  const lowConv = pickLowestConversion(
    inputs.ranking,
    inputs.counterAveragesByBrand,
    used,
  );
  if (lowConv) {
    out.push({
      severity: "warning",
      title: `${lowConv.name} tiene conversión ${formatPercentDelta(lowConv.gap)} bajo counter ${lowConv.brand}`,
      description: "Programa coaching de cierre de venta.",
    });
    used.add(lowConv.baId);
  }

  return out.slice(0, 3);
}

// ── pickers ──────────────────────────────────────────────────────────────────

function pickTopGrowth(
  ranking: readonly BaRankingEntry[],
  deltas: ReadonlyMap<StaffId, number>,
):
  | { baId: StaffId; name: string; delta: number }
  | null {
  let best: { baId: StaffId; name: string; delta: number } | null = null;
  for (const ba of ranking) {
    const delta = deltas.get(ba.baId);
    if (delta === undefined || delta <= 0) continue;
    if (!best || delta > best.delta) {
      best = { baId: ba.baId, name: ba.name, delta };
    }
  }
  return best;
}

function pickLowestGoal(
  ranking: readonly BaRankingEntry[],
  targets: ReadonlyMap<StaffId, number>,
  used: ReadonlySet<StaffId>,
):
  | { baId: StaffId; name: string; ratio: number }
  | null {
  let worst: { baId: StaffId; name: string; ratio: number } | null = null;
  for (const ba of ranking) {
    if (used.has(ba.baId)) continue;
    const target = targets.get(ba.baId);
    if (!target || target <= 0) continue;
    const ratio = ba.salesAmount / target;
    if (!worst || ratio < worst.ratio) {
      worst = { baId: ba.baId, name: ba.name, ratio };
    }
  }
  return worst && worst.ratio < 1 ? worst : null;
}

function pickLowestConversion(
  ranking: readonly BaRankingEntry[],
  counterAveragesByBrand: ReadonlyMap<BrandId, BrandCounterAverages>,
  used: ReadonlySet<StaffId>,
):
  | { baId: StaffId; name: string; brand: BrandId; gap: number }
  | null {
  let worst: { baId: StaffId; name: string; brand: BrandId; gap: number } | null = null;
  for (const ba of ranking) {
    if (used.has(ba.baId)) continue;
    const brandAvg = counterAveragesByBrand.get(ba.brand);
    if (!brandAvg) continue;
    const gap = ba.conversionRate - brandAvg.avgConversionRate;
    if (gap >= 0) continue;
    if (!worst || gap < worst.gap) {
      worst = { baId: ba.baId, name: ba.name, brand: ba.brand, gap };
    }
  }
  return worst;
}

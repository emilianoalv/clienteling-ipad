import type { Client, Segment } from "@/types/client";
import { segmentClient } from "./segment-client";

export interface LevelProgress {
  current: Segment;
  next: Segment | null;
  /** 0..1 toward the next segment. */
  progress: number;
  hint: string;
}

const RECURRENT_VISITS_MIN = 5;
const RECURRENT_LTV_MIN = 50_000;
const VIP_VISITS_MIN = 6;
const VIP_LTV_MIN = 150_000;

/**
 * Computes Luxe Circle progression from the client's *segment* (not tier).
 *
 * Mirrors the prototype's `clientLevelProgress` in `app/data.jsx`:
 *   New      → Recurrent  needs 5 visits OR $50k LTV
 *   Recurrent → VIP       needs 6 visits AND $150k LTV
 *   AtRisk   → Recurrent  needs 1 fresh purchase
 *   VIP      → null       (max tier)
 */
export function calculateLevelProgress(client: Client): LevelProgress {
  const current = segmentClient(client);
  const { ltv, visits } = client.stats;

  if (current === "AtRisk") {
    return {
      current,
      next: "Recurrent",
      progress: 0,
      hint: "Reactiva con 1 compra para volver a Recurrente",
    };
  }

  if (current === "New") {
    const remainingVisits = Math.max(0, RECURRENT_VISITS_MIN - visits);
    const remainingLtv = Math.max(0, RECURRENT_LTV_MIN - ltv);
    const progress = Math.min(1, Math.max(visits / RECURRENT_VISITS_MIN, ltv / RECURRENT_LTV_MIN));
    return {
      current,
      next: "Recurrent",
      progress,
      hint:
        remainingVisits > 0
          ? `${remainingVisits} ${remainingVisits === 1 ? "visita" : "visitas"} para Recurrente`
          : `${formatMxn(remainingLtv)} más en compras para Recurrente`,
    };
  }

  if (current === "Recurrent") {
    const remainingLtv = Math.max(0, VIP_LTV_MIN - ltv);
    const remainingVisits = Math.max(0, VIP_VISITS_MIN - visits);
    const progress = Math.min(1, Math.min(ltv / VIP_LTV_MIN, visits / VIP_VISITS_MIN));
    let hint: string;
    if (remainingLtv > 0 && remainingVisits > 0) {
      hint = `${formatMxn(remainingLtv)} y ${remainingVisits} ${remainingVisits === 1 ? "visita" : "visitas"} para VIP`;
    } else if (remainingLtv > 0) {
      hint = `${formatMxn(remainingLtv)} más en compras para VIP`;
    } else if (remainingVisits > 0) {
      hint = `${remainingVisits} ${remainingVisits === 1 ? "visita" : "visitas"} para VIP`;
    } else {
      hint = "A un paso de VIP";
    }
    return { current, next: "VIP", progress, hint };
  }

  return {
    current: "VIP",
    next: null,
    progress: 1,
    hint: "Nivel máximo · mantén actividad regular",
  };
}

function formatMxn(n: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(Math.max(0, Math.round(n)));
}

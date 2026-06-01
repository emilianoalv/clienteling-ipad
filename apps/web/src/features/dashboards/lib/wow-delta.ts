export type WoWDirection = "up" | "down" | "flat" | "new";

export interface WoWDelta {
  deltaPct: number | null;
  direction: WoWDirection;
}

/**
 * Distingue explícitamente "sin data anterior" ("new") de "mismo valor" ("flat"),
 * cosa que `getPeriodDelta` no hace — ambos devuelven `deltaPct: 0`.
 */
export function computeWoWDelta(
  currentValue: number,
  previousValue: number,
): WoWDelta {
  if (previousValue === 0) {
    return { deltaPct: null, direction: "new" };
  }
  const pct = Math.round(((currentValue - previousValue) / previousValue) * 100);
  return {
    deltaPct: pct,
    direction: pct > 0 ? "up" : pct < 0 ? "down" : "flat",
  };
}

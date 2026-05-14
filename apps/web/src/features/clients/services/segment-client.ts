import type { Client, Segment } from "@/types/client";

const VIP_LTV_MIN = 150_000;
const VIP_VISITS_MIN = 6;
const RECURRENT_VISITS_MIN = 5;
const RECURRENT_LTV_MIN = 50_000;
const AT_RISK_DAYS = 180;
const AT_RISK_VISITS_MIN = 3;
const NEW_VISITS_MAX = 5;

/**
 * Classifies a client into one of four operational segments.
 *
 * Rules (heredadas del prototipo, ver docs/05-feature-modules.md):
 *   - VIP        — LTV ≥ 150k MXN AND ≥ 6 visits
 *   - Recurrent  — ≥ 5 visits OR LTV ≥ 50k MXN
 *   - AtRisk     — no purchase in 180+ days AND ≥ 3 visits historically
 *   - New        — < 5 visits (default)
 */
export function segmentClient(client: Client, now: Date = new Date()): Segment {
  const { ltv, visits, lastPurchase } = client.stats;

  if (ltv >= VIP_LTV_MIN && visits >= VIP_VISITS_MIN) return "VIP";

  if (lastPurchase && visits >= AT_RISK_VISITS_MIN) {
    const daysSince = (now.getTime() - new Date(lastPurchase).getTime()) / 86_400_000;
    if (daysSince > AT_RISK_DAYS) return "AtRisk";
  }

  if (visits >= RECURRENT_VISITS_MIN || ltv >= RECURRENT_LTV_MIN) return "Recurrent";
  if (visits < NEW_VISITS_MAX) return "New";

  return "Recurrent";
}

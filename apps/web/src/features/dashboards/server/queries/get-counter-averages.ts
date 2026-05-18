import "server-only";
import type { InteractionKind } from "@/types/interaction";
import type { Staff } from "@/types/staff";
import { followupTaskRepository } from "@/server/repositories/followup-task.repository";
import { interactionRepository } from "@/server/repositories/interaction.repository";
import { purchaseRepository } from "@/server/repositories/purchase.repository";
import { recommendationRepository } from "@/server/repositories/recommendation.repository";
import { sampleRepository } from "@/server/repositories/sample.repository";
import { userRepository } from "@/server/repositories/user.repository";
import { mergeScope } from "../utils/scope-merge";
import { RoleNotPermittedError } from "../errors";
import type { DashboardFilters } from "../types";

/**
 * Averages of the BA's PEERS in their counter — explicitly excludes the
 * requesting BA so the value is "what my colleagues are doing", not the
 * counter average that I myself would skew.
 *
 * Four metrics, all computed against peer-only data inside `filters.period`:
 * - `avgTicket`: peer purchase total / peer purchase count
 * - `avgReco2PurchaseRate`: peer recos converted-in-period / peer recos created-in-period
 * - `avgSample2PurchaseRate`: peer samples converted-in-period / peer samples given-in-period
 * - `avgFollowUp2RevisitRate`: peer followup→revisita rate (30d window, presencial kinds)
 *
 * `counterHasPeers: false` when the BA is alone in their counter. In that case
 * all averages are 0 — but the flag lets the UI render "Sin peers" instead of
 * misleading "promedio 0".
 *
 * Throws `RoleNotPermittedError` for non-BA roles.
 */
export interface CounterAveragesResult {
  counterHasPeers: boolean;
  avgTicket: number;
  avgReco2PurchaseRate: number;
  avgSample2PurchaseRate: number;
  avgFollowUp2RevisitRate: number;
}

const PRESENCIAL_KINDS: ReadonlySet<InteractionKind> = new Set([
  "consultation",
  "purchase",
  "sample",
  "courtesy",
]);

const REVISITA_WINDOW_DAYS = 30;

const ZERO_AVERAGES = {
  avgTicket: 0,
  avgReco2PurchaseRate: 0,
  avgSample2PurchaseRate: 0,
  avgFollowUp2RevisitRate: 0,
} as const;

export async function getCounterAverages(
  staff: Staff,
  filters: DashboardFilters,
): Promise<CounterAveragesResult> {
  if (staff.role !== "BA") {
    throw new RoleNotPermittedError(staff.role, "getCounterAverages");
  }

  const { storeIds, brands, isEmpty } = mergeScope(staff, filters);

  const users = await userRepository.list();
  const peers = users.filter(
    (u) =>
      u.role === "BA" &&
      u.storeId === staff.storeId &&
      u.brand === staff.brand &&
      u.id !== (staff.id as unknown as string),
  );
  const counterHasPeers = peers.length > 0;

  if (!counterHasPeers || isEmpty) {
    return { counterHasPeers, ...ZERO_AVERAGES };
  }

  const peerIds = new Set(peers.map((u) => u.id as unknown as string));

  const [purchases, recs, samples, tasks, interactions] = await Promise.all([
    purchaseRepository.list({ storeIds, brands }),
    recommendationRepository.list({ storeIds, brands }),
    sampleRepository.list({ storeIds, brands }),
    followupTaskRepository.list({ status: "done" }),
    interactionRepository.list({ storeIds, brands }),
  ]);

  // ── avgTicket ────────────────────────────────────────────────────────────
  let peerSales = 0;
  let peerTxCount = 0;
  for (const p of purchases) {
    if (!peerIds.has(p.baId as unknown as string)) continue;
    const at = new Date(p.at);
    if (at < filters.period.from || at >= filters.period.to) continue;
    peerSales += p.total;
    peerTxCount += 1;
  }
  const avgTicket = peerTxCount === 0 ? 0 : peerSales / peerTxCount;

  // Purchase lookup for conversion attribution.
  const purchaseAtById = new Map<string, string>();
  for (const p of purchases) purchaseAtById.set(p.id as unknown as string, p.at);

  // ── avgReco2PurchaseRate ─────────────────────────────────────────────────
  let recDenom = 0;
  let recNum = 0;
  for (const r of recs) {
    if (!peerIds.has(r.baId as unknown as string)) continue;
    const createdAt = new Date(r.at);
    if (createdAt >= filters.period.from && createdAt < filters.period.to) {
      recDenom += 1;
    }
    if (r.status !== "converted" || !r.purchaseId) continue;
    const convIso = purchaseAtById.get(r.purchaseId as unknown as string);
    if (!convIso) continue;
    const convAt = new Date(convIso);
    if (convAt >= filters.period.from && convAt < filters.period.to) {
      recNum += 1;
    }
  }
  const avgReco2PurchaseRate = recDenom === 0 ? 0 : recNum / recDenom;

  // ── avgSample2PurchaseRate ───────────────────────────────────────────────
  let smpDenom = 0;
  let smpNum = 0;
  for (const s of samples) {
    if (!peerIds.has(s.baId as unknown as string)) continue;
    const givenAt = new Date(s.givenAt);
    if (givenAt >= filters.period.from && givenAt < filters.period.to) {
      smpDenom += 1;
    }
    if (!s.converted || !s.purchaseId) continue;
    const convIso = purchaseAtById.get(s.purchaseId as unknown as string);
    if (!convIso) continue;
    const convAt = new Date(convIso);
    if (convAt >= filters.period.from && convAt < filters.period.to) {
      smpNum += 1;
    }
  }
  const avgSample2PurchaseRate = smpDenom === 0 ? 0 : smpNum / smpDenom;

  // ── avgFollowUp2RevisitRate ──────────────────────────────────────────────
  const interactionsByClient = new Map<string, typeof interactions>();
  for (const i of interactions) {
    const key = i.clientId as unknown as string;
    const arr = interactionsByClient.get(key) ?? [];
    arr.push(i);
    interactionsByClient.set(key, arr);
  }

  let fuDenom = 0;
  let fuNum = 0;
  for (const t of tasks) {
    if (!peerIds.has(t.baId as unknown as string)) continue;
    if (!t.completedAt) continue;
    const completedAt = new Date(t.completedAt);
    if (completedAt < filters.period.from || completedAt >= filters.period.to) {
      continue;
    }
    fuDenom += 1;
    const windowEnd = new Date(
      completedAt.getTime() + REVISITA_WINDOW_DAYS * 24 * 60 * 60 * 1000,
    );
    const clientInts =
      interactionsByClient.get(t.clientId as unknown as string) ?? [];
    const hasRevisita = clientInts.some((i) => {
      if (!PRESENCIAL_KINDS.has(i.kind)) return false;
      if (i.storeId !== staff.storeId) return false;
      if (i.brand !== staff.brand) return false;
      const iAt = new Date(i.at);
      return iAt >= completedAt && iAt < windowEnd;
    });
    if (hasRevisita) fuNum += 1;
  }
  const avgFollowUp2RevisitRate = fuDenom === 0 ? 0 : fuNum / fuDenom;

  return {
    counterHasPeers,
    avgTicket,
    avgReco2PurchaseRate,
    avgSample2PurchaseRate,
    avgFollowUp2RevisitRate,
  };
}

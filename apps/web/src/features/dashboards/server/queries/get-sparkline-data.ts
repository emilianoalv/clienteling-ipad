import "server-only";
import type { BrandId } from "@/types/brand";
import type { Staff, StaffId } from "@/types/staff";
import type { StoreId } from "@/types/store";
import { addDays, addMonths } from "@/lib/date/week";
import { clientRepository } from "@/server/repositories/client.repository";
import { followupTaskRepository } from "@/server/repositories/followup-task.repository";
import { purchaseRepository } from "@/server/repositories/purchase.repository";
import { userRepository } from "@/server/repositories/user.repository";
import { mergeScope } from "../utils/scope-merge";
import type { DashboardFilters, DashboardPeriod } from "../types";

/**
 * Time-series of a single metric, bucketized within `filters.period`.
 *
 * Granularity rule (auto):
 *   range ≤ 31 days → "day"
 *   range 32–90 days → "week"
 *   range  > 90 days → "month"
 *
 * Buckets are half-open `[bucketFrom, bucketTo)` aligned to the period —
 * the FIRST bucket starts at `period.from` exactly (no week-snap), and the
 * LAST bucket is truncated to `period.to`. Empty buckets are kept with
 * `value: 0` (callers expect a fixed number of points to render).
 *
 * Metrics:
 * - `"sales"`        — sum of `purchase.total`
 * - `"transactions"` — count of purchases (1 per purchase)
 * - `"newClients"`   — count of clients with `since` in the bucket
 *                      (ignores `filters.baId` for the same reason as
 *                      `getNewClientsCount`: clients aren't owned by a BA)
 * - `"followUps"`    — count of tasks with `status="done"` and
 *                      `completedAt` in the bucket
 */
export type SparklineMetric = "sales" | "transactions" | "newClients" | "followUps";
export type SparklineGranularity = "day" | "week" | "month";

export interface SparklineOptions {
  metric?: SparklineMetric;
  granularity?: SparklineGranularity;
}

export interface SparklineBucket {
  date: Date;
  value: number;
}

export async function getSparklineData(
  staff: Staff,
  filters: DashboardFilters,
  options: SparklineOptions = {},
): Promise<SparklineBucket[]> {
  const metric = options.metric ?? "sales";
  const granularity = options.granularity ?? autoGranularity(filters.period);
  const buckets = generateBuckets(filters.period, granularity);

  const { storeIds, brands, isEmpty } = mergeScope(staff, filters);
  if (isEmpty) {
    return buckets.map((b) => ({ date: b.from, value: 0 }));
  }

  const items = await collectItems(metric, filters, { storeIds, brands });

  return buckets.map((b) => ({
    date: b.from,
    value: items.reduce(
      (sum, i) => (i.at >= b.from && i.at < b.to ? sum + i.value : sum),
      0,
    ),
  }));
}

// ── helpers ────────────────────────────────────────────────────────────────

function autoGranularity(period: DashboardPeriod): SparklineGranularity {
  const days = (period.to.getTime() - period.from.getTime()) / 86_400_000;
  if (days <= 31) return "day";
  if (days <= 90) return "week";
  return "month";
}

function generateBuckets(
  period: DashboardPeriod,
  granularity: SparklineGranularity,
): DashboardPeriod[] {
  const out: DashboardPeriod[] = [];
  let cursor = new Date(period.from);
  while (cursor < period.to) {
    const next =
      granularity === "day"
        ? addDays(cursor, 1)
        : granularity === "week"
          ? addDays(cursor, 7)
          : addMonths(cursor, 1);
    const bucketEnd = next > period.to ? period.to : next;
    out.push({ from: new Date(cursor), to: bucketEnd });
    cursor = next;
  }
  return out;
}

interface BucketItem {
  at: Date;
  value: number;
  baId?: StaffId;
}

async function collectItems(
  metric: SparklineMetric,
  filters: DashboardFilters,
  scope: { storeIds?: readonly StoreId[]; brands?: readonly BrandId[] },
): Promise<BucketItem[]> {
  let items: BucketItem[];

  if (metric === "sales" || metric === "transactions") {
    const purchases = await purchaseRepository.list(scope);
    items = purchases.map((p) => ({
      at: new Date(p.at),
      value: metric === "sales" ? p.total : 1,
      baId: p.baId,
    }));
  } else if (metric === "newClients") {
    const clients = await clientRepository.list(scope);
    items = clients.map((c) => ({ at: new Date(c.since), value: 1 }));
  } else {
    const [tasks, users] = await Promise.all([
      followupTaskRepository.list({ status: "done" }),
      userRepository.list(),
    ]);
    const owner = new Map<string, { storeId?: StoreId; brand?: BrandId }>();
    for (const u of users) {
      owner.set(u.id, { storeId: u.storeId, brand: u.brand });
    }
    const storeSet = scope.storeIds ? new Set(scope.storeIds) : null;
    const brandSet = scope.brands ? new Set(scope.brands) : null;
    items = [];
    for (const t of tasks) {
      if (!t.completedAt) continue;
      const o = owner.get(t.baId as unknown as string);
      if (!o || !o.storeId || !o.brand) continue;
      if (storeSet && !storeSet.has(o.storeId)) continue;
      if (brandSet && !brandSet.has(o.brand)) continue;
      items.push({ at: new Date(t.completedAt), value: 1, baId: t.baId });
    }
  }

  // `filters.baId` applies only to items that carry a `baId`.
  // Items without baId (newClients) are unaffected — consistent with
  // `getNewClientsCount` ignoring the filter.
  if (filters.baId) {
    items = items.filter((i) => i.baId === undefined || i.baId === filters.baId);
  }
  return items;
}

// Re-export for tests/UI that want to call the helper directly.
export const _internal = { autoGranularity, generateBuckets };

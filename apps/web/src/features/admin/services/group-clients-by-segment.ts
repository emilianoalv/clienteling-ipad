import type { Client, Segment } from "@/types/client";
import { segmentClient } from "@/features/clients/services/segment-client";

export interface SegmentBucket {
  segment: Segment;
  clients: readonly Client[];
}

const ORDER: readonly Segment[] = ["VIP", "Recurrent", "New", "AtRisk"];

/**
 * Buckets a list of clients into the 4 operational segments. Pure — uses the
 * shared `segmentClient` rules so Admin/Manager segment views stay in sync
 * with the per-client classification used elsewhere.
 */
export function groupClientsBySegment(
  clients: readonly Client[],
  now: Date = new Date(),
): readonly SegmentBucket[] {
  const map = new Map<Segment, Client[]>(ORDER.map((s) => [s, []]));
  for (const c of clients) {
    const seg = segmentClient(c, now);
    map.get(seg)!.push(c);
  }
  return ORDER.map((segment) => ({ segment, clients: map.get(segment) ?? [] }));
}

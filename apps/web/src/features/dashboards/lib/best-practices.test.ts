import { describe, expect, it } from "vitest";
import type { StoreId } from "@/types/store";
import {
  computeBestPractices,
  type StoreMetricsSnapshot,
} from "./best-practices";

const A = "st-a" as unknown as StoreId;
const B = "st-b" as unknown as StoreId;

function snapshot(
  overrides: Partial<StoreMetricsSnapshot> = {},
): StoreMetricsSnapshot {
  return {
    convReco: 25,
    convSample: 20,
    avgTicket: 5000,
    newClientsPerDay: 2,
    adoption: 80,
    ...overrides,
  };
}

describe("computeBestPractices", () => {
  it("emits an insight when one store beats another by > 15%", () => {
    const out = computeBestPractices(
      new Map([
        [A, snapshot({ convReco: 30 })],
        [B, snapshot({ convReco: 18 })],
      ]),
      new Map([
        [A, "Polanco"],
        [B, "Santa Fe"],
      ]),
    );
    expect(out.length).toBeGreaterThan(0);
    const reco = out.find((x) => x.metric === "convReco");
    expect(reco?.winnerStore).toBe("Polanco");
    expect(reco?.loserStore).toBe("Santa Fe");
    expect(reco?.differencePercent).toBeGreaterThan(15);
  });

  it("returns [] when all gaps are ≤ 15%", () => {
    const out = computeBestPractices(
      new Map([
        [A, snapshot()],
        [B, snapshot({ convReco: 23 })], // 25 vs 23 → ~9%
      ]),
      new Map([
        [A, "A"],
        [B, "B"],
      ]),
    );
    expect(out).toEqual([]);
  });

  it("returns at most 3 insights", () => {
    const out = computeBestPractices(
      new Map([
        [
          A,
          snapshot({
            convReco: 40,
            convSample: 35,
            avgTicket: 8000,
            newClientsPerDay: 5,
            adoption: 100,
          }),
        ],
        [
          B,
          snapshot({
            convReco: 10,
            convSample: 12,
            avgTicket: 3000,
            newClientsPerDay: 1,
            adoption: 50,
          }),
        ],
      ]),
      new Map([
        [A, "Top"],
        [B, "Bottom"],
      ]),
    );
    expect(out.length).toBeLessThanOrEqual(3);
  });

  it("returns [] with fewer than 2 stores", () => {
    const out = computeBestPractices(
      new Map([[A, snapshot()]]),
      new Map([[A, "Polanco"]]),
    );
    expect(out).toEqual([]);
  });

  it("skips metrics where the loser is 0 (no meaningful ratio)", () => {
    const out = computeBestPractices(
      new Map([
        [A, snapshot({ convSample: 30 })],
        [B, snapshot({ convSample: 0 })],
      ]),
      new Map([
        [A, "A"],
        [B, "B"],
      ]),
    );
    expect(out.find((x) => x.metric === "convSample")).toBeUndefined();
  });
});

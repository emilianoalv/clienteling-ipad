import { describe, expect, it } from "vitest";
import { getPendingFollowups } from "./get-pending-followups";
import {
  aprilPeriod,
  baLcmPer,
  baLcmPer2,
  baLcmPol,
  baYslPol,
  emptyPeriod,
} from "./_test-fixtures";

// PENDING tasks with absolute dueAt (PER × LCM only):
//   ft-09 cl-elena    Andrea  dueAt 2026-04-15 → overdue (anchor may-1)
//   ft-10 cl-elena    Regina  dueAt 2026-04-22 → overdue
//   ft-11 cl-cristina Regina  dueAt 2026-05-10 → upcoming
//
// (Plus four pending tasks with relativeISO in other counters; those don't
// interfere when we filter by PER × LCM scope.)

describe("getPendingFollowups", () => {
  it("BA Andrea (PER × LCM) ve sus 3 tasks PER LCM en orden: overdue → upcoming", async () => {
    const r = await getPendingFollowups(baLcmPer2, { period: aprilPeriod });
    expect(r).toHaveLength(3);
    expect(r[0]!.taskId).toBe("ft-09");
    expect(r[0]!.isOverdue).toBe(true);
    expect(r[1]!.taskId).toBe("ft-10");
    expect(r[1]!.isOverdue).toBe(true);
    expect(r[2]!.taskId).toBe("ft-11");
    expect(r[2]!.isOverdue).toBe(false);
  });

  it("dentro de overdue: orden ASCENDENTE por dueAt (más vieja primero)", async () => {
    const r = await getPendingFollowups(baLcmPer, { period: aprilPeriod });
    const overdue = r.filter((x) => x.isOverdue);
    expect(overdue.length).toBeGreaterThanOrEqual(2);
    expect(overdue[0]!.dueAt.getTime()).toBeLessThan(overdue[1]!.dueAt.getTime());
  });

  it("dentro de upcoming: orden ASCENDENTE por dueAt (más próxima primero)", async () => {
    // Hay 1 upcoming en PER LCM (ft-11). Para tener al menos 2 upcoming
    // verificamos en BA Lancôme Polanco si caen tasks relativas upcoming.
    const r = await getPendingFollowups(baLcmPol, { period: aprilPeriod });
    const upcoming = r.filter((x) => !x.isOverdue);
    for (let i = 1; i < upcoming.length; i++) {
      expect(upcoming[i]!.dueAt.getTime()).toBeGreaterThanOrEqual(
        upcoming[i - 1]!.dueAt.getTime(),
      );
    }
  });

  it("filtro baId: solo las del BA", async () => {
    const r = await getPendingFollowups(baLcmPer, {
      period: aprilPeriod,
      baId: baLcmPer2.id, // Andrea
    });
    expect(r).toHaveLength(1);
    expect(r[0]!.taskId).toBe("ft-09");
  });

  it("BA Lancôme Polanco no ve tasks PER LCM (ft-09/10/11)", async () => {
    const r = await getPendingFollowups(baLcmPol, { period: aprilPeriod });
    expect(r.find((x) => x.taskId === "ft-09")).toBeUndefined();
    expect(r.find((x) => x.taskId === "ft-11")).toBeUndefined();
  });

  it("scope merge vacío → []", async () => {
    const r = await getPendingFollowups(baLcmPer2, {
      period: aprilPeriod,
      brands: ["YSL"],
    });
    expect(r).toEqual([]);
  });

  it("BA YSL Polanco: 0 (no hay pending POL YSL en seed)", async () => {
    const r = await getPendingFollowups(baYslPol, { period: aprilPeriod });
    expect(r).toEqual([]);
  });

  it("isOverdue se calcula contra filters.period.to (no contra hoy real)", async () => {
    // Si anchor = abr-1, todas las dueAt absolutas de abril+ son upcoming.
    const r = await getPendingFollowups(baLcmPer, {
      period: { ...aprilPeriod, to: new Date("2026-04-01T00:00:00.000Z") },
    });
    expect(r.every((x) => !x.isOverdue)).toBe(true);
  });

  it("período empty (anchor año 2000): todas las tasks 2026 son upcoming", async () => {
    const r = await getPendingFollowups(baLcmPer, { period: emptyPeriod });
    expect(r.every((x) => !x.isOverdue)).toBe(true);
  });
});

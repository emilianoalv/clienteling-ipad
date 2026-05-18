import { describe, expect, it } from "vitest";
import { getUpcomingAppointments } from "./get-upcoming-appointments";
import {
  aprilPeriod,
  baLcmPer2,
  baYslPol,
} from "./_test-fixtures";

// PER × LCM absolute appointments:
//   ap-13 abr-15 today
//   ap-14 abr-15 today
//   ap-15 abr-20 upcoming
//   ap-16 abr-22 upcoming

const apr15Anchor = {
  period: {
    from: aprilPeriod.from,
    to: new Date("2026-04-15T18:00:00.000Z"), // anchor abr-15
  },
};

describe("getUpcomingAppointments", () => {
  it("BA Andrea anchor=abr-15 default 7d: ap-15 + ap-16", async () => {
    // Window (abr-15, abr-22] → ap-15 abr-20, ap-16 abr-22
    const r = await getUpcomingAppointments(baLcmPer2, apr15Anchor);
    expect(r).toHaveLength(2);
    expect(r[0]!.id).toBe("ap-15");
    expect(r[1]!.id).toBe("ap-16");
  });

  it("cita hoy NO aparece (excluida del window)", async () => {
    const r = await getUpcomingAppointments(baLcmPer2, apr15Anchor);
    expect(r.find((x) => x.id === "ap-13")).toBeUndefined();
    expect(r.find((x) => x.id === "ap-14")).toBeUndefined();
  });

  it("cita en 8 días NO aparece con default 7", async () => {
    // anchor=abr-14, window=7 → cubre (abr-14, abr-21]. ap-16 (abr-22) fuera.
    const r = await getUpcomingAppointments(baLcmPer2, {
      period: {
        from: aprilPeriod.from,
        to: new Date("2026-04-14T12:00:00.000Z"),
      },
    });
    expect(r.find((x) => x.id === "ap-16")).toBeUndefined();
    expect(r.find((x) => x.id === "ap-15")).toBeDefined();
  });

  it("windowDays=14 incluye ap-16 (abr-22)", async () => {
    const r = await getUpcomingAppointments(
      baLcmPer2,
      {
        period: {
          from: aprilPeriod.from,
          to: new Date("2026-04-14T12:00:00.000Z"),
        },
      },
      { windowDays: 14 },
    );
    expect(r.find((x) => x.id === "ap-16")).toBeDefined();
  });

  it("orden ascendente por at", async () => {
    const r = await getUpcomingAppointments(baLcmPer2, apr15Anchor);
    for (let i = 1; i < r.length; i++) {
      expect(r[i]!.at.localeCompare(r[i - 1]!.at)).toBeGreaterThanOrEqual(0);
    }
  });

  it("scope merge vacío → []", async () => {
    const r = await getUpcomingAppointments(baLcmPer2, {
      ...apr15Anchor,
      brands: ["YSL"],
    });
    expect(r).toEqual([]);
  });

  it("BA YSL Polanco anchor=abr-15: 0 (no hay POL YSL abr 16-22 absolutas)", async () => {
    const r = await getUpcomingAppointments(baYslPol, apr15Anchor);
    expect(r).toEqual([]);
  });
});

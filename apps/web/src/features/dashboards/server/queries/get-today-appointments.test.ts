import { describe, expect, it } from "vitest";
import { getTodayAppointments } from "./get-today-appointments";
import {
  aprilPeriod,
  baLcmPer2,
  baLcmPol,
  baYslPol,
} from "./_test-fixtures";

// Absolute appointments en PER × LCM (Andrea):
//   ap-13 cl-elena   2026-04-15T10:00Z  scheduled
//   ap-14 cl-cristina 2026-04-15T15:00Z  confirmed
//   ap-15 cl-elena   2026-04-20T11:00Z  rescheduled
//   ap-16 cl-cristina 2026-04-22T14:00Z  cancelled

const apr15Anchor = {
  period: {
    from: aprilPeriod.from,
    to: new Date("2026-04-15T18:00:00.000Z"), // anchor day = apr-15
  },
};

const apr14Anchor = {
  period: {
    from: aprilPeriod.from,
    to: new Date("2026-04-14T12:00:00.000Z"),
  },
};

describe("getTodayAppointments", () => {
  it("BA Andrea anchor=abr-15: 2 citas (ap-13 + ap-14) ordenadas por at", async () => {
    const r = await getTodayAppointments(baLcmPer2, apr15Anchor);
    expect(r).toHaveLength(2);
    expect(r[0]!.id).toBe("ap-13");
    expect(r[1]!.id).toBe("ap-14");
  });

  it("cita ayer (anchor=abr-15, busca apr-14): NO ap-13/14", async () => {
    const r = await getTodayAppointments(baLcmPer2, apr14Anchor);
    expect(r).toEqual([]);
  });

  it("cita mañana (anchor=abr-14): NO ap-13/14 (son abr-15)", async () => {
    const r = await getTodayAppointments(baLcmPer2, apr14Anchor);
    expect(r.find((x) => x.id === "ap-13")).toBeUndefined();
  });

  it("filtro baId: solo las del BA", async () => {
    const r = await getTodayAppointments(baLcmPer2, {
      ...apr15Anchor,
      baId: baLcmPer2.id,
    });
    expect(r).toHaveLength(2);
  });

  it("BA Lancôme Polanco anchor=abr-15: 0 (no hay POL LCM abr-15)", async () => {
    const r = await getTodayAppointments(baLcmPol, apr15Anchor);
    expect(r).toEqual([]);
  });

  it("scope merge vacío → []", async () => {
    const r = await getTodayAppointments(baLcmPer2, {
      ...apr15Anchor,
      brands: ["YSL"],
    });
    expect(r).toEqual([]);
  });

  it("BA YSL Polanco abr-15: 0", async () => {
    const r = await getTodayAppointments(baYslPol, apr15Anchor);
    expect(r).toEqual([]);
  });
});

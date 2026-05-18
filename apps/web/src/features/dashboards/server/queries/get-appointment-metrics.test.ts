import { describe, expect, it } from "vitest";
import { getAppointmentMetrics } from "./get-appointment-metrics";
import {
  aprilPeriod,
  baLcmPer2,
  baLcmPol,
  emptyPeriod,
} from "./_test-fixtures";

// PER × LCM (Andrea) absolute appointments en abril 2026:
//   ap-13 at abr-15 scheduled
//   ap-14 at abr-15 confirmed
//   ap-15 at abr-20 rescheduled, rescheduledAt=abr-12
//   ap-16 at abr-22 cancelled, cancelledAt=abr-18
//
// Filtering by baId=Andrea isolates from relativeISO appointments.

describe("getAppointmentMetrics", () => {
  it("Andrea abril (filtros.baId): total=4, new=4, rescheduled=1, canceled=1", async () => {
    const m = await getAppointmentMetrics(baLcmPer2, {
      period: aprilPeriod,
      baId: baLcmPer2.id,
    });
    expect(m.total).toBe(4);
    expect(m.new).toBe(4); // proxy = at en período (sin createdAt)
    expect(m.rescheduled).toBe(1); // ap-15 con rescheduledAt en abril
    expect(m.canceled).toBe(1); // ap-16 con cancelledAt en abril
  });

  it("rescheduled solo cuando status='rescheduled' Y rescheduledAt en período", async () => {
    // ap-15 rescheduledAt=abr-12. Si período = [abr-1, abr-10), no entra.
    const m = await getAppointmentMetrics(baLcmPer2, {
      period: {
        from: new Date("2026-04-01T00:00:00.000Z"),
        to: new Date("2026-04-10T00:00:00.000Z"),
      },
      baId: baLcmPer2.id,
    });
    expect(m.rescheduled).toBe(0);
  });

  it("canceled solo cuando status='cancelled' Y cancelledAt en período", async () => {
    // ap-16 cancelledAt=abr-18. Período [abr-1, abr-15) excluye.
    const m = await getAppointmentMetrics(baLcmPer2, {
      period: {
        from: new Date("2026-04-01T00:00:00.000Z"),
        to: new Date("2026-04-15T00:00:00.000Z"),
      },
      baId: baLcmPer2.id,
    });
    expect(m.canceled).toBe(0);
  });

  it("BA Lancôme Polanco abril (sin baId): no ve PER LCM absolutas", async () => {
    const m = await getAppointmentMetrics(baLcmPol, { period: aprilPeriod });
    // Solo verán las POL LCM relativas (si caen en abril del clock real).
    // Lo importante: no ven las absolutas PER LCM.
    expect(m.rescheduled).toBe(0); // ninguna POL LCM tiene rescheduled
    expect(m.canceled).toBe(0); // ninguna POL LCM tiene cancelled absoluto
  });

  it("scope merge vacío: total=0, new=0, rescheduled=0, canceled=0", async () => {
    const m = await getAppointmentMetrics(baLcmPer2, {
      period: aprilPeriod,
      brands: ["YSL"],
    });
    expect(m.total).toBe(0);
    expect(m.new).toBe(0);
    expect(m.rescheduled).toBe(0);
    expect(m.canceled).toBe(0);
  });

  it("período sin citas (año 2000) → todo 0", async () => {
    const m = await getAppointmentMetrics(baLcmPer2, { period: emptyPeriod });
    expect(m.total).toBe(0);
    expect(m.new).toBe(0);
    expect(m.rescheduled).toBe(0);
    expect(m.canceled).toBe(0);
  });

  it("período acotado a abr-15: solo ap-13 + ap-14 (los del 15)", async () => {
    const m = await getAppointmentMetrics(baLcmPer2, {
      period: {
        from: new Date("2026-04-15T00:00:00.000Z"),
        to: new Date("2026-04-16T00:00:00.000Z"),
      },
      baId: baLcmPer2.id,
    });
    expect(m.total).toBe(2);
    expect(m.new).toBe(2);
  });
});

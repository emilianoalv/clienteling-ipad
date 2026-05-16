import { describe, expect, it } from "vitest";
import type { Appointment, AppointmentId, AppointmentStatus } from "@/types/appointment";
import type { ClientId } from "@/types/client";
import type { StaffId } from "@/types/staff";
import type { StoreId } from "@/types/store";
import { aggregateAppointmentStats } from "./appointment-stats";

function make(status: AppointmentStatus): Appointment {
  return {
    id: `ap-${status}` as AppointmentId,
    clientId: "cl-x" as ClientId,
    baId: "ba-x" as StaffId,
    brand: "Lancôme",
    storeId: "st-pol" as StoreId,
    at: "2026-04-24T10:00:00.000Z",
    durationMin: 30,
    kind: "consultation",
    status,
  };
}

describe("aggregateAppointmentStats", () => {
  it("returns zeros for an empty list", () => {
    const s = aggregateAppointmentStats([]);
    expect(s).toEqual({
      total: 0,
      scheduled: 0,
      rescheduled: 0,
      cancelled: 0,
      completed: 0,
      rescheduleRate: 0,
      cancelRate: 0,
    });
  });

  it("groups scheduled + confirmed under scheduled count", () => {
    const s = aggregateAppointmentStats([make("scheduled"), make("confirmed"), make("confirmed")]);
    expect(s.scheduled).toBe(3);
    expect(s.total).toBe(3);
  });

  it("computes reschedule and cancel rates", () => {
    const list = [
      make("scheduled"),
      make("rescheduled"),
      make("rescheduled"),
      make("cancelled"),
      make("completed"),
    ];
    const s = aggregateAppointmentStats(list);
    expect(s.rescheduled).toBe(2);
    expect(s.cancelled).toBe(1);
    expect(s.completed).toBe(1);
    expect(s.rescheduleRate).toBeCloseTo(0.4, 5);
    expect(s.cancelRate).toBeCloseTo(0.2, 5);
  });
});

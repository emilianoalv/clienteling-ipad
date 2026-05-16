import { describe, expect, it } from "vitest";
import { hasConflict } from "./has-conflict";
import type { Appointment } from "@/types/appointment";
import type { StoreId } from "@/types/store";

const BA_A = "ba-1" as Appointment["baId"];
const BA_B = "ba-2" as Appointment["baId"];

function appt(over: Partial<Appointment>): Appointment {
  return {
    id: "ap-1" as Appointment["id"],
    clientId: "cl-1" as Appointment["clientId"],
    baId: BA_A,
    brand: "Lancôme",
    storeId: "st-pol" as StoreId,
    at: "2026-05-12T10:00:00.000Z",
    durationMin: 45,
    kind: "consultation",
    status: "confirmed",
    ...over,
  };
}

describe("hasConflict", () => {
  it("detects overlapping slot for the same BA", () => {
    const conflict = hasConflict(
      { baId: BA_A, at: "2026-05-12T10:30:00.000Z", durationMin: 30 },
      [appt({})],
    );
    expect(conflict).toBe(true);
  });

  it("ignores cancelled appointments", () => {
    const conflict = hasConflict(
      { baId: BA_A, at: "2026-05-12T10:30:00.000Z", durationMin: 30 },
      [appt({ status: "cancelled" })],
    );
    expect(conflict).toBe(false);
  });

  it("ignores other BAs", () => {
    const conflict = hasConflict(
      { baId: BA_B, at: "2026-05-12T10:30:00.000Z", durationMin: 30 },
      [appt({ baId: BA_A })],
    );
    expect(conflict).toBe(false);
  });

  it("excludes the appointment being updated", () => {
    const conflict = hasConflict(
      { baId: BA_A, at: "2026-05-12T10:00:00.000Z", durationMin: 45, excludeId: "ap-1" as Appointment["id"] },
      [appt({})],
    );
    expect(conflict).toBe(false);
  });

  it("returns false for adjacent (touching) slots", () => {
    const conflict = hasConflict(
      { baId: BA_A, at: "2026-05-12T10:45:00.000Z", durationMin: 30 },
      [appt({})],
    );
    expect(conflict).toBe(false);
  });
});

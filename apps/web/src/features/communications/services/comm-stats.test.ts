import { describe, expect, it } from "vitest";
import type {
  Channel,
  Communication,
  CommunicationDirection,
  CommunicationId,
  CommunicationStatus,
} from "@/types/communication";
import type { ClientId } from "@/types/client";
import type { StaffId } from "@/types/staff";
import { aggregateCommStats } from "./comm-stats";

function comm(
  id: string,
  channel: Channel,
  direction: CommunicationDirection,
  status: CommunicationStatus,
): Communication {
  return {
    id: id as CommunicationId,
    clientId: "cl-x" as ClientId,
    baId: "ba-x" as StaffId,
    brand: "Lancôme",
    channel,
    direction,
    at: "2026-05-01T00:00:00.000Z",
    body: "",
    status,
  };
}

describe("aggregateCommStats", () => {
  it("returns zeros for empty input", () => {
    const s = aggregateCommStats([]);
    expect(s.sent).toBe(0);
    expect(s.readRate).toBe(0);
    expect(s.responded).toBe(0);
    expect(s.optOuts).toBe(0);
    expect(s.channelMix).toEqual({ WhatsApp: 0, Email: 0, SMS: 0 });
  });

  it("counts only outbound for sent / readRate / channelMix", () => {
    const s = aggregateCommStats([
      comm("a", "WhatsApp", "outbound", "read"),
      comm("b", "WhatsApp", "outbound", "delivered"),
      comm("c", "Email", "outbound", "responded"),
      comm("d", "WhatsApp", "inbound", "read"),
    ]);
    expect(s.sent).toBe(3);
    // 2 of 3 outbound are read/responded
    expect(s.readRate).toBeCloseTo(2 / 3, 5);
    expect(s.responded).toBe(1);
    expect(s.channelMix.WhatsApp).toBeCloseTo(2 / 3, 5);
    expect(s.channelMix.Email).toBeCloseTo(1 / 3, 5);
    expect(s.channelMix.SMS).toBe(0);
  });

  it("treats failed comms as opt-outs", () => {
    const s = aggregateCommStats([comm("a", "SMS", "outbound", "failed")]);
    expect(s.optOuts).toBe(1);
  });
});

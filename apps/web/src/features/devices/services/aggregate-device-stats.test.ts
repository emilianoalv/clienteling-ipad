import { describe, expect, it } from "vitest";
import type { Device, DeviceId, DeviceStatus } from "@/types/device";
import type { StoreId } from "@/types/store";
import { aggregateDeviceStats } from "./aggregate-device-stats";

function dev(status: DeviceStatus): Device {
  return {
    id: `dv-${status}` as DeviceId,
    serial: "S",
    storeId: "st-x" as StoreId,
    status,
    assignedBA: null,
    lastSync: "2026-04-23T00:00:00.000Z",
    os: "iPadOS 18",
    app: "1.0.0",
  };
}

describe("aggregateDeviceStats", () => {
  it("returns zeros for empty list", () => {
    expect(aggregateDeviceStats([])).toEqual({
      total: 0,
      active: 0,
      maintenance: 0,
      inactive: 0,
    });
  });

  it("counts each status independently", () => {
    const stats = aggregateDeviceStats([
      dev("active"),
      dev("active"),
      dev("maintenance"),
      dev("inactive"),
      dev("active"),
    ]);
    expect(stats).toEqual({ total: 5, active: 3, maintenance: 1, inactive: 1 });
  });
});

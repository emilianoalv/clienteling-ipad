import type { Device, DeviceStatus } from "@/types/device";

export interface DeviceStats {
  total: number;
  active: number;
  maintenance: number;
  inactive: number;
}

const STATUSES: readonly DeviceStatus[] = ["active", "maintenance", "inactive"];

/**
 * Aggregates a device list into the 4-tile KPI strip shown at the top of the
 * devices page. Pure — does not touch the repository.
 */
export function aggregateDeviceStats(devices: readonly Device[]): DeviceStats {
  const counts = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<DeviceStatus, number>;
  for (const d of devices) counts[d.status]++;
  return {
    total: devices.length,
    active: counts.active,
    maintenance: counts.maintenance,
    inactive: counts.inactive,
  };
}

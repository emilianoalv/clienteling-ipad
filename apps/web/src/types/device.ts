import type { Branded } from "./branded";
import type { StaffId } from "./staff";
import type { StoreId } from "./store";

export type DeviceId = Branded<string, "Device">;

export type DeviceStatus = "active" | "maintenance" | "inactive";

export interface Device {
  id: DeviceId;
  serial: string;
  storeId: StoreId;
  status: DeviceStatus;
  /** Beauty Advisor currently assigned to this device. */
  assignedBA: StaffId | null;
  /** ISO date-time of the last successful sync. */
  lastSync: string;
  os: string;
  app: string;
}

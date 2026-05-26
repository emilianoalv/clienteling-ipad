import type { BrandId } from "./brand";
import type { Branded } from "./branded";
import type { StaffId } from "./staff";
import type { StoreId } from "./store";

export type DeviceId = Branded<string, "Device">;

export type DeviceStatus = "active" | "maintenance" | "inactive";

export interface Device {
  id: DeviceId;
  serial: string;
  storeId: StoreId;
  /**
   * Marca del stand al que pertenece el iPad. Una tienda física tiene
   * stands Lancôme y YSL separados, cada uno con su propia caja de
   * dispositivos asignados. El device hereda la marca de su stand.
   */
  brand: BrandId;
  status: DeviceStatus;
  /** Beauty Advisor currently assigned to this device. */
  assignedBA: StaffId | null;
  /** ISO date-time of the last successful sync. */
  lastSync: string;
  os: string;
  app: string;
}

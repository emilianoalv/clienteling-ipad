import "server-only";
import type { Device, DeviceId, DeviceStatus } from "@/types/device";
import type { StaffId } from "@/types/staff";
import type { StoreId } from "@/types/store";

const ST_POLANCO = "st-polanco" as StoreId;
const ST_SANTA_FE = "st-santa-fe" as StoreId;
const ST_PALACIO = "st-palacio-polanco" as StoreId;

const BA_DEMO = "ba-demo-ba" as StaffId;
const BA_2 = "ba-demo-2" as StaffId;
const BA_3 = "ba-demo-3" as StaffId;

const SEED: Device[] = [
  {
    id: "dv-01" as DeviceId,
    serial: "LX-IPAD-001",
    storeId: ST_POLANCO,
    status: "active",
    assignedBA: BA_DEMO,
    lastSync: "2026-04-23T09:12:00.000Z",
    os: "iPadOS 18.3",
    app: "1.4.2",
  },
  {
    id: "dv-02" as DeviceId,
    serial: "LX-IPAD-002",
    storeId: ST_POLANCO,
    status: "active",
    assignedBA: BA_2,
    lastSync: "2026-04-23T08:55:00.000Z",
    os: "iPadOS 18.3",
    app: "1.4.2",
  },
  {
    id: "dv-03" as DeviceId,
    serial: "LX-IPAD-003",
    storeId: ST_PALACIO,
    status: "active",
    assignedBA: BA_3,
    lastSync: "2026-04-23T09:04:00.000Z",
    os: "iPadOS 18.3",
    app: "1.4.2",
  },
  {
    id: "dv-04" as DeviceId,
    serial: "LX-IPAD-004",
    storeId: ST_PALACIO,
    status: "maintenance",
    assignedBA: null,
    lastSync: "2026-04-20T18:00:00.000Z",
    os: "iPadOS 18.2",
    app: "1.4.0",
  },
  {
    id: "dv-05" as DeviceId,
    serial: "LX-IPAD-005",
    storeId: ST_SANTA_FE,
    status: "active",
    assignedBA: BA_DEMO,
    lastSync: "2026-04-23T09:20:00.000Z",
    os: "iPadOS 18.3",
    app: "1.4.2",
  },
  {
    id: "dv-06" as DeviceId,
    serial: "LX-IPAD-006",
    storeId: ST_SANTA_FE,
    status: "inactive",
    assignedBA: null,
    lastSync: "2026-03-12T14:30:00.000Z",
    os: "iPadOS 18.1",
    app: "1.3.8",
  },
];

import { persistent } from "./_persist";
const DEVICES = persistent("__clienteling.devices", () => new Map<DeviceId, Device>(SEED.map((d) => [d.id, d])));

export interface DeviceListFilter {
  status?: DeviceStatus;
  storeIds?: readonly StoreId[];
}

export interface DeviceRepository {
  list(filter?: DeviceListFilter): Promise<Device[]>;
  findById(id: DeviceId): Promise<Device | null>;
}

export const deviceRepository: DeviceRepository = {
  async list(filter = {}) {
    const all = Array.from(DEVICES.values());
    return all.filter((d) => {
      if (filter.status && d.status !== filter.status) return false;
      if (filter.storeIds && filter.storeIds.length && !filter.storeIds.includes(d.storeId)) {
        return false;
      }
      return true;
    });
  },
  async findById(id) {
    return DEVICES.get(id) ?? null;
  },
};

import "server-only";
import type { BrandId } from "@/types/brand";
import type { Device, DeviceId, DeviceStatus } from "@/types/device";
import type { StaffId } from "@/types/staff";
import type { StoreId } from "@/types/store";

const ST_POL = "st-pol" as StoreId;
const ST_PER = "st-per" as StoreId;
const ST_STF = "st-stf" as StoreId;

const BA_POL_LCM_1 = "us-ba-pol-lcm-1" as StaffId; // Valentina Ríos
const BA_POL_LCM_2 = "us-ba-pol-lcm-2" as StaffId; // Fernanda Oliveros
const BA_POL_YSL_1 = "us-ba-pol-ysl-1" as StaffId; // Daniela Castro
const BA_POL_YSL_2 = "us-ba-pol-ysl-2" as StaffId; // Sofía Marín
const BA_PER_LCM_1 = "us-ba-per-lcm-1" as StaffId; // Regina Mendoza
const BA_PER_LCM_2 = "us-ba-per-lcm-2" as StaffId; // Andrea Lozano
const BA_PER_YSL_1 = "us-ba-per-ysl-1" as StaffId; // Lucía Cabrera
const BA_PER_YSL_2 = "us-ba-per-ysl-2" as StaffId; // Mariana Esquivel
const BA_STF_LCM_1 = "us-ba-stf-lcm-1" as StaffId; // Renata Salazar
const BA_STF_LCM_2 = "us-ba-stf-lcm-2" as StaffId; // Ximena Pereda
const BA_STF_YSL_1 = "us-ba-stf-ysl-1" as StaffId; // Paulina Treviño
const BA_STF_YSL_2 = "us-ba-stf-ysl-2" as StaffId; // Carolina Andrade

const SEED: Device[] = [
  // ── Polanco · 5 dispositivos (4 BAs + 1 mantenimiento) ────────────────
  {
    id: "dv-01" as DeviceId,
    serial: "LX-IPAD-POL-001",
    storeId: ST_POL,
    brand: "Lancôme",
    status: "active",
    assignedBA: BA_POL_LCM_1,
    lastSync: "2026-05-25T09:12:00.000Z",
    os: "iPadOS 18.3",
    app: "1.4.2",
  },
  {
    id: "dv-02" as DeviceId,
    serial: "LX-IPAD-POL-002",
    storeId: ST_POL,
    brand: "Lancôme",
    status: "active",
    assignedBA: BA_POL_LCM_2,
    lastSync: "2026-05-25T08:55:00.000Z",
    os: "iPadOS 18.3",
    app: "1.4.2",
  },
  {
    id: "dv-03" as DeviceId,
    serial: "YS-IPAD-POL-001",
    storeId: ST_POL,
    brand: "YSL",
    status: "active",
    assignedBA: BA_POL_YSL_1,
    lastSync: "2026-05-25T09:04:00.000Z",
    os: "iPadOS 18.3",
    app: "1.4.2",
  },
  {
    id: "dv-04" as DeviceId,
    serial: "YS-IPAD-POL-002",
    storeId: ST_POL,
    brand: "YSL",
    status: "active",
    assignedBA: BA_POL_YSL_2,
    lastSync: "2026-05-25T07:30:00.000Z",
    os: "iPadOS 18.3",
    app: "1.4.2",
  },
  {
    id: "dv-05" as DeviceId,
    serial: "LX-IPAD-POL-003",
    storeId: ST_POL,
    brand: "Lancôme",
    status: "maintenance",
    assignedBA: null,
    lastSync: "2026-05-20T18:00:00.000Z",
    os: "iPadOS 18.2",
    app: "1.4.0",
  },

  // ── Perisur · 5 dispositivos (4 BAs + 1 inactivo) ─────────────────────
  {
    id: "dv-06" as DeviceId,
    serial: "LX-IPAD-PER-001",
    storeId: ST_PER,
    brand: "Lancôme",
    status: "active",
    assignedBA: BA_PER_LCM_1,
    lastSync: "2026-05-25T10:15:00.000Z",
    os: "iPadOS 18.3",
    app: "1.4.2",
  },
  {
    id: "dv-07" as DeviceId,
    serial: "LX-IPAD-PER-002",
    storeId: ST_PER,
    brand: "Lancôme",
    status: "active",
    assignedBA: BA_PER_LCM_2,
    lastSync: "2026-05-25T09:48:00.000Z",
    os: "iPadOS 18.3",
    app: "1.4.2",
  },
  {
    id: "dv-08" as DeviceId,
    serial: "YS-IPAD-PER-001",
    storeId: ST_PER,
    brand: "YSL",
    status: "active",
    assignedBA: BA_PER_YSL_1,
    lastSync: "2026-05-25T08:22:00.000Z",
    os: "iPadOS 18.3",
    app: "1.4.2",
  },
  {
    id: "dv-09" as DeviceId,
    serial: "YS-IPAD-PER-002",
    storeId: ST_PER,
    brand: "YSL",
    status: "active",
    assignedBA: BA_PER_YSL_2,
    lastSync: "2026-05-25T10:01:00.000Z",
    os: "iPadOS 18.3",
    app: "1.4.2",
  },
  {
    id: "dv-10" as DeviceId,
    serial: "YS-IPAD-PER-003",
    storeId: ST_PER,
    brand: "YSL",
    status: "inactive",
    assignedBA: null,
    lastSync: "2026-03-12T14:30:00.000Z",
    os: "iPadOS 18.1",
    app: "1.3.8",
  },

  // ── Santa Fe · 5 dispositivos (4 BAs + 1 mantenimiento) ───────────────
  {
    id: "dv-11" as DeviceId,
    serial: "LX-IPAD-STF-001",
    storeId: ST_STF,
    brand: "Lancôme",
    status: "active",
    assignedBA: BA_STF_LCM_1,
    lastSync: "2026-05-25T09:32:00.000Z",
    os: "iPadOS 18.3",
    app: "1.4.2",
  },
  {
    id: "dv-12" as DeviceId,
    serial: "LX-IPAD-STF-002",
    storeId: ST_STF,
    brand: "Lancôme",
    status: "active",
    assignedBA: BA_STF_LCM_2,
    lastSync: "2026-05-25T08:18:00.000Z",
    os: "iPadOS 18.3",
    app: "1.4.2",
  },
  {
    id: "dv-13" as DeviceId,
    serial: "YS-IPAD-STF-001",
    storeId: ST_STF,
    brand: "YSL",
    status: "active",
    assignedBA: BA_STF_YSL_1,
    lastSync: "2026-05-25T11:05:00.000Z",
    os: "iPadOS 18.3",
    app: "1.4.2",
  },
  {
    id: "dv-14" as DeviceId,
    serial: "YS-IPAD-STF-002",
    storeId: ST_STF,
    brand: "YSL",
    status: "active",
    assignedBA: BA_STF_YSL_2,
    lastSync: "2026-05-25T10:42:00.000Z",
    os: "iPadOS 18.3",
    app: "1.4.2",
  },
  {
    id: "dv-15" as DeviceId,
    serial: "YS-IPAD-STF-003",
    storeId: ST_STF,
    brand: "YSL",
    status: "maintenance",
    assignedBA: null,
    lastSync: "2026-05-18T16:20:00.000Z",
    os: "iPadOS 18.2",
    app: "1.4.0",
  },
];

import { persistent } from "./_persist";
// v2 invalida v1 — el seed cambió de IDs ficticios (ba-demo-ba) a IDs
// reales del catálogo de staff, agregó brand a cada device y duplicó
// el catálogo para cubrir las 12 BAs.
const DEVICES = persistent(
  "__clienteling.devices.v2",
  () => new Map<DeviceId, Device>(SEED.map((d) => [d.id, d])),
);

export interface DeviceListFilter {
  status?: DeviceStatus;
  storeIds?: readonly StoreId[];
  /** Brand scope. Cuando viene, solo devuelve devices de esas marcas. */
  brands?: readonly BrandId[];
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
      if (filter.brands && filter.brands.length && !filter.brands.includes(d.brand)) {
        return false;
      }
      return true;
    });
  },
  async findById(id) {
    return DEVICES.get(id) ?? null;
  },
};

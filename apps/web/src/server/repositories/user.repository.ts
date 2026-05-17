import "server-only";
import type { BrandId } from "@/types/brand";
import type { User, UserId } from "@/types/user";
import type { StoreId } from "@/types/store";

const ST_POL = "st-pol" as StoreId;
const ST_PER = "st-per" as StoreId;
const ST_STF = "st-stf" as StoreId;

const LCM: BrandId = "Lancôme";
const YSL: BrandId = "YSL";

/**
 * Per BRD (RF-51..RF-55):
 * - BA: single brand (`brand`), single store
 * - Gerente de Tienda: single store, all brands of that store (no `brands` → undefined)
 * - Supervisor de Zona: multi-store, all brands of zone
 * - Administrador Central: nacional
 *
 * Distribución (17 usuarios):
 *   - 3 tiendas × (2 BA Lancôme + 2 BA YSL + 1 Gerente) = 15
 *   - 1 Supervisor cubre zona Centro (Polanco + Santa Fe)
 *   - 1 Admin Central
 */
const SEED: User[] = [
  // ── Liverpool Polanco ─────────────────────────────────────────────────────
  { id: "us-ba-pol-lcm-1" as UserId, name: "Valentina Ríos", role: "BA", storeId: ST_POL, brand: LCM },
  { id: "us-ba-pol-lcm-2" as UserId, name: "Fernanda Oliveros", role: "BA", storeId: ST_POL, brand: LCM },
  { id: "us-ba-pol-ysl-1" as UserId, name: "Daniela Castro", role: "BA", storeId: ST_POL, brand: YSL },
  { id: "us-ba-pol-ysl-2" as UserId, name: "Sofía Marín", role: "BA", storeId: ST_POL, brand: YSL },
  { id: "us-gte-pol" as UserId, name: "Camila Santos", role: "Gerente", storeId: ST_POL },

  // ── Liverpool Perisur ─────────────────────────────────────────────────────
  { id: "us-ba-per-lcm-1" as UserId, name: "Regina Mendoza", role: "BA", storeId: ST_PER, brand: LCM },
  { id: "us-ba-per-lcm-2" as UserId, name: "Andrea Lozano", role: "BA", storeId: ST_PER, brand: LCM },
  { id: "us-ba-per-ysl-1" as UserId, name: "Lucía Cabrera", role: "BA", storeId: ST_PER, brand: YSL },
  { id: "us-ba-per-ysl-2" as UserId, name: "Mariana Esquivel", role: "BA", storeId: ST_PER, brand: YSL },
  { id: "us-gte-per" as UserId, name: "Patricia Herrera", role: "Gerente", storeId: ST_PER },

  // ── Palacio Santa Fe ──────────────────────────────────────────────────────
  { id: "us-ba-stf-lcm-1" as UserId, name: "Renata Salazar", role: "BA", storeId: ST_STF, brand: LCM },
  { id: "us-ba-stf-lcm-2" as UserId, name: "Ximena Pereda", role: "BA", storeId: ST_STF, brand: LCM },
  { id: "us-ba-stf-ysl-1" as UserId, name: "Paulina Treviño", role: "BA", storeId: ST_STF, brand: YSL },
  { id: "us-ba-stf-ysl-2" as UserId, name: "Carolina Andrade", role: "BA", storeId: ST_STF, brand: YSL },
  { id: "us-gte-stf" as UserId, name: "Mónica Solís", role: "Gerente", storeId: ST_STF },

  // ── Supervisor Zona Centro (Polanco + Santa Fe — Perisur fuera de zona) ──
  {
    id: "us-sup-centro" as UserId,
    name: "Diego Salvatierra",
    role: "Supervisor",
    storeIds: [ST_POL, ST_STF],
    zone: "Centro",
  },

  // ── Administrador Central ─────────────────────────────────────────────────
  {
    id: "us-admin" as UserId,
    name: "Ana Lucía Ferrer",
    role: "Admin",
    team: "Marketing CRM",
  },
];

import { persistent } from "./_persist";
const USERS = persistent("__clienteling.users.v3", () => new Map<UserId, User>(SEED.map((u) => [u.id, u])));

export interface UserRepository {
  list(): Promise<User[]>;
  findById(id: UserId): Promise<User | null>;
  findFirstByRole(role: User["role"]): Promise<User | null>;
}

export const userRepository: UserRepository = {
  async list() {
    return Array.from(USERS.values());
  },
  async findById(id) {
    return USERS.get(id) ?? null;
  },
  async findFirstByRole(role) {
    for (const user of USERS.values()) {
      if (user.role === role) return user;
    }
    return null;
  },
};

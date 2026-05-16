import "server-only";
import type { BrandId } from "@/types/brand";
import type { User, UserId } from "@/types/user";
import type { StoreId } from "@/types/store";

const ST_POL = "st-pol" as StoreId;
const ST_PER = "st-per" as StoreId;
const ST_STF = "st-stf" as StoreId;

const BOTH_BRANDS: readonly BrandId[] = ["Lancôme", "YSL"];

const SEED: User[] = [
  // 6 BAs — 2 per store
  { id: "us-ba-pol-1" as UserId, name: "Valentina Ríos", role: "BA", storeId: ST_POL, brands: BOTH_BRANDS },
  { id: "us-ba-pol-2" as UserId, name: "Fernanda Oliveros", role: "BA", storeId: ST_POL, brands: BOTH_BRANDS },
  { id: "us-ba-per-1" as UserId, name: "Daniela Castro", role: "BA", storeId: ST_PER, brands: BOTH_BRANDS },
  { id: "us-ba-per-2" as UserId, name: "Sofía Marín", role: "BA", storeId: ST_PER, brands: BOTH_BRANDS },
  { id: "us-ba-stf-1" as UserId, name: "Camila Santos", role: "BA", storeId: ST_STF, brands: BOTH_BRANDS },
  { id: "us-ba-stf-2" as UserId, name: "Regina Mendoza", role: "BA", storeId: ST_STF, brands: BOTH_BRANDS },
  // 3 Managers — 1 per store
  { id: "us-mgr-pol" as UserId, name: "Paulina Treviño", role: "Manager", storeId: ST_POL, brands: BOTH_BRANDS },
  { id: "us-mgr-per" as UserId, name: "Mariana Vega", role: "Manager", storeId: ST_PER, brands: BOTH_BRANDS },
  { id: "us-mgr-stf" as UserId, name: "Roberto Carballo", role: "Manager", storeId: ST_STF, brands: BOTH_BRANDS },
  // 1 Supervisor — covers Polanco + Perisur (zona Norte)
  {
    id: "us-sup-norte" as UserId,
    name: "Diego Salvatierra",
    role: "Supervisor",
    storeIds: [ST_POL, ST_PER],
    zone: "Norte",
    brands: BOTH_BRANDS,
  },
  // 1 Admin Central
  {
    id: "us-admin" as UserId,
    name: "Ana Lucía Ferrer",
    role: "Admin",
    team: "Marketing CRM",
    brands: BOTH_BRANDS,
  },
];

import { persistent } from "./_persist";
const USERS = persistent("__clienteling.users.v2", () => new Map<UserId, User>(SEED.map((u) => [u.id, u])));

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

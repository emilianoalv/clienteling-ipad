import "server-only";
import type { User, UserId } from "@/types/user";
import type { StoreId } from "@/types/store";

const ST_POLANCO = "st-polanco" as StoreId;
const ST_SANTA_FE = "st-santa-fe" as StoreId;
const ST_PALACIO = "st-palacio-polanco" as StoreId;

const SEED: User[] = [
  { id: "us-01" as UserId, name: "Valentina Ríos", role: "BA", storeId: ST_POLANCO },
  { id: "us-02" as UserId, name: "Fernanda Oliveros", role: "BA", storeId: ST_POLANCO },
  { id: "us-03" as UserId, name: "Regina Mendoza", role: "BA", storeId: ST_PALACIO },
  { id: "us-04" as UserId, name: "Paulina Treviño", role: "Manager", storeId: ST_POLANCO },
  { id: "us-05" as UserId, name: "Camila Santos", role: "BA", storeId: ST_SANTA_FE },
  {
    id: "us-06" as UserId,
    name: "Diego Salvatierra",
    role: "Supervisor",
    storeIds: [ST_POLANCO, ST_PALACIO, ST_SANTA_FE],
    zone: "Centro",
  },
  { id: "us-07" as UserId, name: "Ana Lucía Ferrer", role: "Admin", team: "Marketing CRM" },
  { id: "us-08" as UserId, name: "Luis Felipe Bernal", role: "Admin", team: "Operaciones Retail" },
  { id: "us-09" as UserId, name: "Ricardo Mejía", role: "HQ", team: "Dirección regional" },
];

import { persistent } from "./_persist";
const USERS = persistent("__clienteling.users", () => new Map<UserId, User>(SEED.map((u) => [u.id, u])));

export interface UserRepository {
  list(): Promise<User[]>;
  findById(id: UserId): Promise<User | null>;
}

export const userRepository: UserRepository = {
  async list() {
    return Array.from(USERS.values());
  },
  async findById(id) {
    return USERS.get(id) ?? null;
  },
};

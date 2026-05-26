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
 *
 * Credenciales en `docs/credenciales-demo.md`. Hashes bcrypt generados
 * con `scripts/generate-password-hashes.mjs` (10 rounds).
 */
const SEED: User[] = [
  // ── Liverpool Polanco ─────────────────────────────────────────────────────
  {
    id: "us-ba-pol-lcm-1" as UserId,
    name: "Valentina Ríos",
    role: "BA",
    email: "valentina.rios@lancome.com.mx",
    passwordHash: "$2b$10$d323zAm4wuYm65XOQEUeR.QMiZzHFd/rJPSsqLFvTNCDDEtqVdQOy",
    storeId: ST_POL,
    brand: LCM,
    monthlyTarget: 500_000,
  },
  {
    id: "us-ba-pol-lcm-2" as UserId,
    name: "Fernanda Oliveros",
    role: "BA",
    email: "fernanda.oliveros@lancome.com.mx",
    passwordHash: "$2b$10$aIDu7TDuhzCVawJJ2pM68.Fzm12Iy4RTXeBmPTgtKwqIaAV8FARvC",
    storeId: ST_POL,
    brand: LCM,
    monthlyTarget: 500_000,
  },
  {
    id: "us-ba-pol-ysl-1" as UserId,
    name: "Daniela Castro",
    role: "BA",
    email: "daniela.castro@ysl.com.mx",
    passwordHash: "$2b$10$yqqX4DSNa4DVSTJcHM6ZfuE.BFE0huXUHSAITAFhIQIG9lSNNWvPm",
    storeId: ST_POL,
    brand: YSL,
    monthlyTarget: 400_000,
  },
  {
    id: "us-ba-pol-ysl-2" as UserId,
    name: "Sofía Marín",
    role: "BA",
    email: "sofia.marin@ysl.com.mx",
    passwordHash: "$2b$10$oaKLUJHCJ5OG532hvVwqPOw8W0HK1L1dm5zBbSjwde3S2T9O67dK.",
    storeId: ST_POL,
    brand: YSL,
    monthlyTarget: 400_000,
  },
  {
    id: "us-gte-pol" as UserId,
    name: "Camila Santos",
    role: "Gerente",
    email: "camila.santos@loreal.com.mx",
    passwordHash: "$2b$10$MmzujyWoysyVxGcV5XTqtOcBMbmVcb7hMLiL/V0Y3/1fdmsTEeooa",
    storeId: ST_POL,
  },

  // ── Liverpool Perisur ─────────────────────────────────────────────────────
  {
    id: "us-ba-per-lcm-1" as UserId,
    name: "Regina Mendoza",
    role: "BA",
    email: "regina.mendoza@lancome.com.mx",
    passwordHash: "$2b$10$gdo9Yjfla9sozotN/GYmweS7Smww8c4P44GlariVqG3PYAMGhLwLC",
    storeId: ST_PER,
    brand: LCM,
    monthlyTarget: 450_000,
  },
  {
    id: "us-ba-per-lcm-2" as UserId,
    name: "Andrea Lozano",
    role: "BA",
    email: "andrea.lozano@lancome.com.mx",
    passwordHash: "$2b$10$jdXopdJ6jVVkFkSySxIjpetxH0RHFdf4SvWg7oH4MQ6iUQcMGbjlO",
    storeId: ST_PER,
    brand: LCM,
    monthlyTarget: 450_000,
  },
  {
    id: "us-ba-per-ysl-1" as UserId,
    name: "Lucía Cabrera",
    role: "BA",
    email: "lucia.cabrera@ysl.com.mx",
    passwordHash: "$2b$10$.a4mWHH66jM1m8hEzmNlduPzNcM2Q0Io4zozJlDVXRcw.tw7YtatC",
    storeId: ST_PER,
    brand: YSL,
    monthlyTarget: 400_000,
  },
  {
    id: "us-ba-per-ysl-2" as UserId,
    name: "Mariana Esquivel",
    role: "BA",
    email: "mariana.esquivel@ysl.com.mx",
    passwordHash: "$2b$10$QGkKoUAZBCbmmtQvMyfr0uNsTdwfluqxy2FABE2PDeKXD88aBq.wi",
    storeId: ST_PER,
    brand: YSL,
    monthlyTarget: 400_000,
  },
  {
    id: "us-gte-per" as UserId,
    name: "Patricia Herrera",
    role: "Gerente",
    email: "patricia.herrera@loreal.com.mx",
    passwordHash: "$2b$10$ASo0PvFMhWAkCEQRp7A0EelH9CfVjVZe0FeuHPkv8g4A.N5GW9TAa",
    storeId: ST_PER,
  },

  // ── Palacio Santa Fe ──────────────────────────────────────────────────────
  {
    id: "us-ba-stf-lcm-1" as UserId,
    name: "Renata Salazar",
    role: "BA",
    email: "renata.salazar@lancome.com.mx",
    passwordHash: "$2b$10$9skCI/BLNmofnLMmPuNcQuIx64YYFh1TK.SOIxn/.32BKJ1h.teAu",
    storeId: ST_STF,
    brand: LCM,
    monthlyTarget: 600_000,
  },
  {
    id: "us-ba-stf-lcm-2" as UserId,
    name: "Ximena Pereda",
    role: "BA",
    email: "ximena.pereda@lancome.com.mx",
    passwordHash: "$2b$10$xRAm6qlIxCQOUOFN3yp4ROgzXplN0d5otb4oWf1ofjnU2qeUEPFMa",
    storeId: ST_STF,
    brand: LCM,
    monthlyTarget: 600_000,
  },
  {
    id: "us-ba-stf-ysl-1" as UserId,
    name: "Paulina Treviño",
    role: "BA",
    email: "paulina.trevino@ysl.com.mx",
    passwordHash: "$2b$10$fJNBTW2UaU5FSESFQVh03.6.fQw6YW9LaT3DBe1hHYMOSurPdF5D2",
    storeId: ST_STF,
    brand: YSL,
    monthlyTarget: 500_000,
  },
  {
    id: "us-ba-stf-ysl-2" as UserId,
    name: "Carolina Andrade",
    role: "BA",
    email: "carolina.andrade@ysl.com.mx",
    passwordHash: "$2b$10$bff5JNRwVksxccGH.wRQe.qEsVv9UZadSuOIZp30XOH72QOuksPx.",
    storeId: ST_STF,
    brand: YSL,
    monthlyTarget: 500_000,
  },
  {
    id: "us-gte-stf" as UserId,
    name: "Mónica Solís",
    role: "Gerente",
    email: "monica.solis@loreal.com.mx",
    passwordHash: "$2b$10$6rPEgbWk0HtAKHmhQawAb.3sjbKP1eYQrnUC5EnerHGgOoeLyZOke",
    storeId: ST_STF,
  },

  // ── Supervisor Zona Centro (Polanco + Santa Fe — Perisur fuera de zona) ──
  {
    id: "us-sup-centro" as UserId,
    name: "Diego Salvatierra",
    role: "Supervisor",
    email: "diego.salvatierra@loreal.com.mx",
    passwordHash: "$2b$10$hFnHdbrq14KP456HKvs0w.sifrA3TfIEdyVlAYpOg1hd.XNcmFJjK",
    storeIds: [ST_POL, ST_STF],
    zone: "Centro",
  },

  // ── Administrador Central ─────────────────────────────────────────────────
  {
    id: "us-admin" as UserId,
    name: "Ana Lucía Ferrer",
    role: "Admin",
    email: "ana.ferrer@loreal.com.mx",
    passwordHash: "$2b$10$gSVmj1/5CKGmr6qlscJkbeu2zfq1PQFSp/fZCKggOAZASRiQLgnne",
    team: "Marketing CRM",
  },
];

import { persistent } from "./_persist";
// v5 invalida v4 — agrega email + passwordHash a cada usuario para
// soportar el login real simulado (Sprint 1.2).
const USERS = persistent("__clienteling.users.v5", () => new Map<UserId, User>(SEED.map((u) => [u.id, u])));

export interface UserRepository {
  list(): Promise<User[]>;
  findById(id: UserId): Promise<User | null>;
  findFirstByRole(role: User["role"]): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(user: User): Promise<User>;
  update(id: UserId, patch: Partial<Omit<User, "id">>): Promise<User | null>;
  delete(id: UserId): Promise<boolean>;
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
  async findByEmail(email) {
    const normalized = email.trim().toLowerCase();
    for (const user of USERS.values()) {
      if (user.email.toLowerCase() === normalized) return user;
    }
    return null;
  },
  async create(user) {
    USERS.set(user.id, user);
    return user;
  },
  async update(id, patch) {
    const current = USERS.get(id);
    if (!current) return null;
    // Merge primero, luego re-fija `id` por defensividad para que el
    // patch no pueda mutar la identidad. El cast es seguro porque User
    // es una discriminated union por `role` y el merge preserva los
    // campos requeridos por la variante actual a menos que `role`
    // cambie — en ese caso el caller debe darnos todos los campos.
    const next = { ...current, ...patch, id } as User;
    USERS.set(id, next);
    return next;
  },
  async delete(id) {
    return USERS.delete(id);
  },
};

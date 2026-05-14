import type { BrandId } from "./brand";
import type { Branded } from "./branded";
import type { StoreId } from "./store";

export type StaffId = Branded<string, "Staff">;

export type Role = "BA" | "Manager" | "Supervisor" | "HQ" | "Admin";

export interface StaffBase {
  id: StaffId;
  name: string;
  initials: string;
  brands: readonly BrandId[];
}

export type BA = StaffBase & { role: "BA"; storeId: StoreId };
export type Manager = StaffBase & { role: "Manager"; storeId: StoreId };
export type Supervisor = StaffBase & { role: "Supervisor"; storeIds: readonly StoreId[] };
export type HQ = StaffBase & { role: "HQ" };
export type Admin = StaffBase & { role: "Admin" };

export type Staff = BA | Manager | Supervisor | HQ | Admin;

/** Stores visible to a staff member (server should always validate against this). */
export function visibleStoreIds(staff: Staff, allStoreIds: readonly StoreId[]): readonly StoreId[] {
  switch (staff.role) {
    case "BA":
    case "Manager":
      return [staff.storeId];
    case "Supervisor":
      return staff.storeIds;
    case "HQ":
    case "Admin":
      return allStoreIds;
  }
}

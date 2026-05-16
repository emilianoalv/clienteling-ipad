import type { BrandId } from "./brand";
import type { Branded } from "./branded";
import type { Role } from "./staff";
import type { StoreId } from "./store";

export type UserId = Branded<string, "User">;

/**
 * A platform user account. Distinct from `Staff` (which models BAs/Managers
 * doing in-store work): `User` covers HQ / Admin / Supervisor roles too, plus
 * extra metadata (team, zone) used in the Admin "Usuarios & roles" panel.
 */
export interface User {
  id: UserId;
  name: string;
  role: Role;
  /** Brands the user is licensed to operate on. Used to scope queries by brand. */
  brands: readonly BrandId[];
  /** BA / Manager: assigned store. Empty for HQ / Admin / Supervisor. */
  storeId?: StoreId;
  /** Supervisor: list of stores in zone. */
  storeIds?: readonly StoreId[];
  /** Supervisor: zone label. */
  zone?: string;
  /** Admin: team / department. */
  team?: string;
}

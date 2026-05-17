import type { BrandId } from "./brand";
import type { Branded } from "./branded";
import type { Role } from "./staff";
import type { StoreId } from "./store";

export type UserId = Branded<string, "User">;

/**
 * A platform user account. Distinct from `Staff` (which models BAs/Gerentes
 * doing in-store work): `User` is the persistence-side record, plus extra
 * metadata (team, zone) used in the Admin "Usuarios & roles" panel.
 *
 * Brand semantics:
 * - BA → `brand` (singular, required at userToStaff time)
 * - Gerente/Supervisor/Admin → `brands` (optional plural; undefined = all)
 */
export interface User {
  id: UserId;
  name: string;
  role: Role;
  /** BA / Gerente: assigned store. Empty for Supervisor / Admin. */
  storeId?: StoreId;
  /** Supervisor: list of stores in zone. */
  storeIds?: readonly StoreId[];
  /** BA: the single brand they represent (required for BA). */
  brand?: BrandId;
  /** Gerente / Supervisor / Admin: optional brand restriction; undefined = all. */
  brands?: readonly BrandId[];
  /** Supervisor: zone label. */
  zone?: string;
  /** Admin: team / department. */
  team?: string;
}

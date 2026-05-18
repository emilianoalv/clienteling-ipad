import type { Branded } from "./branded";

export type StoreId = Branded<string, "Store">;
export type StoreChain = "Liverpool" | "Palacio";

export interface Store {
  id: StoreId;
  name: string;
  chain: StoreChain;
  city: string;
  address: string;
  /**
   * Monthly sales objective in MXN. Used by `getOperationalAlerts` to flag
   * stores below threshold. Undefined → store is excluded from quota alerts.
   */
  monthlyTarget?: number;
}

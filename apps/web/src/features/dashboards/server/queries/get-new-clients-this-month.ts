import "server-only";
import type { Staff } from "@/types/staff";
import { clientRepository } from "@/server/repositories/client.repository";
import { mergeScope } from "../utils/scope-merge";
import type { DashboardFilters } from "../types";

/**
 * Cuenta clientes de la cartera del BA cuyo alta (`since`) cae en el
 * mes calendario actual. Ignora `filters.period` a propósito — el label
 * "nuevos este mes" siempre se refiere al mes actual, independientemente
 * del período que el usuario seleccione en el dashboard.
 */
export async function getNewClientsThisMonth(
  staff: Staff,
  filters: DashboardFilters,
): Promise<number> {
  const { storeIds, brands, isEmpty } = mergeScope(staff, filters);
  if (isEmpty) return 0;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const cartera = await clientRepository.list({
    storeIds,
    brands,
    assignedBaId: staff.id,
  });
  return cartera.reduce((count, c) => {
    return new Date(c.since) >= startOfMonth ? count + 1 : count;
  }, 0);
}

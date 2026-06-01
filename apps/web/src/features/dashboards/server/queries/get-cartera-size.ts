import "server-only";
import type { Staff } from "@/types/staff";
import { clientRepository } from "@/server/repositories/client.repository";
import { mergeScope } from "../utils/scope-merge";
import type { DashboardFilters } from "../types";

/**
 * Cartera asignada del BA: clientes cuyo `assignedBaIds` incluye `staff.id`.
 * Mismo universo que el BA ve en `/ba/clients` y que `gerente/team` muestra
 * como `clientsCount` por BA. Sirve de denominador honesto para el bloque
 * "Mi cartera" del BA dashboard.
 */
export async function getCarteraSize(
  staff: Staff,
  filters: DashboardFilters,
): Promise<number> {
  const { storeIds, brands, isEmpty } = mergeScope(staff, filters);
  if (isEmpty) return 0;

  const clients = await clientRepository.list({
    storeIds,
    brands,
    assignedBaId: staff.id,
  });
  return clients.length;
}

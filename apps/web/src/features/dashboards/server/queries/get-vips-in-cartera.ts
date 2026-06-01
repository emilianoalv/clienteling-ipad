import "server-only";
import type { Staff } from "@/types/staff";
import { clientRepository } from "@/server/repositories/client.repository";
import { segmentClient } from "@/features/clients/services/segment-client";
import { mergeScope } from "../utils/scope-merge";
import type { DashboardFilters } from "../types";

/**
 * Cuenta clientes de la cartera del BA cuyo segmento operativo es "VIP".
 * Reusa `segmentClient()` para alinearse con la definición que el resto
 * del dashboard (cinta de segments, /admin/segments) ya considera VIP —
 * mismo número en todos lados.
 */
export async function getVipsInCartera(
  staff: Staff,
  filters: DashboardFilters,
): Promise<number> {
  const { storeIds, brands, isEmpty } = mergeScope(staff, filters);
  if (isEmpty) return 0;

  const cartera = await clientRepository.list({
    storeIds,
    brands,
    assignedBaId: staff.id,
  });
  return cartera.filter((c) => segmentClient(c) === "VIP").length;
}

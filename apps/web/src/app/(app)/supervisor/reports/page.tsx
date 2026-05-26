import { SectionHeader } from "@/components/patterns";
import { RoleReportsScreen } from "@/features/dashboards/components/role-reports-screen";
import { parseFilters } from "@/features/dashboards/lib/parse-filters";
import { brandScopeFor, storeScopeFor } from "@/server/auth/scope";
import { requireSession } from "@/server/auth/session";
import { storeRepository } from "@/server/repositories/store.repository";
import { userRepository } from "@/server/repositories/user.repository";
import type { StaffId } from "@/types/staff";

/**
 * /supervisor/reports — los mismos reportes que el Gerente pero con
 * scope multi-tienda (RF-54). Reusa `<RoleReportsScreen>` y le pasa la
 * lista de tiendas de la zona para que el FilterBar pueda filtrar por
 * tienda específica además de período / marca / BA.
 */
export default async function SupervisorReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const { staff } = await requireSession();
  if (staff.role !== "Supervisor") {
    throw new Error("Esta vista solo está disponible para el rol Supervisor.");
  }

  const filters = parseFilters(params, { defaultPeriod: "mtd" });
  const storeIds = storeScopeFor(staff);
  const brands = brandScopeFor(staff);

  const [users, stores] = await Promise.all([
    userRepository.list(),
    storeRepository.list(),
  ]);

  const storeOptions = stores
    .filter((s) => storeIds?.includes(s.id) ?? true)
    .map((s) => ({ id: s.id, label: s.name }));

  const baOptions = users
    .filter((u) => {
      if (u.role !== "BA") return false;
      if (storeIds && u.storeId && !storeIds.includes(u.storeId)) return false;
      if (brands && u.brand && !brands.includes(u.brand)) return false;
      return true;
    })
    .map((u) => ({ id: u.id as unknown as StaffId, label: u.name }));

  const showBrandFilter = brands === undefined || brands.length > 1;

  return (
    <section className="flex flex-col gap-4">
      <SectionHeader title="Reportes" eyebrow="Mi zona" />
      <RoleReportsScreen
        filters={filters}
        baOptions={baOptions}
        storeOptions={storeOptions}
        showBrandFilter={showBrandFilter}
        agendaHref="/supervisor/appointments"
      />
    </section>
  );
}

import { SectionHeader } from "@/components/patterns";
import { RoleReportsScreen } from "@/features/dashboards/components/role-reports-screen";
import { parseFilters } from "@/features/dashboards/lib/parse-filters";
import { brandScopeFor, storeScopeFor } from "@/server/auth/scope";
import { requireSession } from "@/server/auth/session";
import { userRepository } from "@/server/repositories/user.repository";
import type { StaffId } from "@/types/staff";

/**
 * /gerente/reports — entrega los reportes que pide el BRD para el rol
 * (RF-43 clientes, RF-45 desempeño BA, RF-47 conversión por BA, más un
 * link a /gerente/appointments para RF-46). El scope se intersecta en
 * cada server action con `mergeScope` — el Gerente solo ve datos de
 * su tienda y sus marcas asignadas.
 */
export default async function ManagerReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const { staff } = await requireSession();
  if (staff.role !== "Gerente") {
    throw new Error("Esta vista solo está disponible para el rol Gerente.");
  }

  const filters = parseFilters(params, { defaultPeriod: "mtd" });
  const storeIds = storeScopeFor(staff);
  const brands = brandScopeFor(staff);

  const users = await userRepository.list();
  const baOptions = users
    .filter((u) => {
      if (u.role !== "BA") return false;
      if (storeIds && u.storeId && !storeIds.includes(u.storeId)) return false;
      if (brands && u.brand && !brands.includes(u.brand)) return false;
      return true;
    })
    .map((u) => ({ id: u.id as unknown as StaffId, label: u.name }));

  // Solo mostramos el filtro de marca cuando el Gerente tiene scope
  // multi-marca. Si solo ve una (o sigue undefined = ambas), el toggle
  // tendría 1 opción real y es ruido.
  const showBrandFilter = brands === undefined || brands.length > 1;

  return (
    <section className="flex flex-col gap-4">
      <SectionHeader title="Reportes" eyebrow="Mi tienda" />
      <RoleReportsScreen
        filters={filters}
        baOptions={baOptions}
        showBrandFilter={showBrandFilter}
        agendaHref="/gerente/appointments"
      />
    </section>
  );
}

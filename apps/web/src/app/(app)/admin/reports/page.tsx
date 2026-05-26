import { SectionHeader } from "@/components/patterns";
import { RoleReportsScreen } from "@/features/dashboards/components/role-reports-screen";
import { parseFilters } from "@/features/dashboards/lib/parse-filters";
import { requireSession } from "@/server/auth/session";
import { storeRepository } from "@/server/repositories/store.repository";
import { userRepository } from "@/server/repositories/user.repository";
import type { StaffId } from "@/types/staff";

/**
 * /admin/reports — los mismos 3 reportes que para Gerente / Supervisor,
 * con scope nacional. Admin no tiene tienda fija ni marca: `mergeScope`
 * devuelve `undefined` en ambos ejes, así que los exports caen sobre
 * toda la operación a menos que el FilterBar lo acote manualmente por
 * tienda / marca / BA.
 *
 * Para RF-46 (agenda) el Admin no tiene página dedicada — el export
 * vive en el dashboard nacional en la sección "Alertas + Operación".
 */
export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const { staff } = await requireSession();
  if (staff.role !== "Admin") {
    throw new Error("Esta vista solo está disponible para el rol Admin.");
  }

  const filters = parseFilters(params, { defaultPeriod: "mtd" });

  const [users, stores] = await Promise.all([
    userRepository.list(),
    storeRepository.list(),
  ]);

  const storeOptions = stores.map((s) => ({ id: s.id, label: s.name }));
  const baOptions = users
    .filter((u) => u.role === "BA")
    .map((u) => ({ id: u.id as unknown as StaffId, label: u.name }));

  return (
    <section className="flex flex-col gap-4">
      <SectionHeader title="Reportes" eyebrow="Nacional" />
      <RoleReportsScreen
        filters={filters}
        baOptions={baOptions}
        storeOptions={storeOptions}
        showBrandFilter
        agendaHref="/admin"
      />
    </section>
  );
}

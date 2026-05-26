import { notFound } from "next/navigation";
import { SectionHeader } from "@/components/patterns";
import { TeamScreen } from "@/features/gerente/components/team-screen";
import { requireSession } from "@/server/auth/session";
import { brandScopeFor, storeScopeFor } from "@/server/auth/scope";
import { clientRepository } from "@/server/repositories/client.repository";
import { followupTaskRepository } from "@/server/repositories/followup-task.repository";
import { purchaseRepository } from "@/server/repositories/purchase.repository";
import { storeRepository } from "@/server/repositories/store.repository";
import { userRepository } from "@/server/repositories/user.repository";
import type { StaffId } from "@/types/staff";

/**
 * /gerente/team — vista de equipo. Gerente ve los BAs de su tienda con
 * sus KPIs principales (clientes asignados, tareas pendientes, ventas
 * del mes). Puede hacer drill-down a un BA específico para ver sus
 * clientes con un click.
 *
 * Antes esta ruta no existía: el rail apuntaba a /gerente/team pero la
 * page no se había creado (404).
 */
export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ ba?: string }>;
}) {
  const { staff } = await requireSession();
  const storeIds = storeScopeFor(staff);
  const brands = brandScopeFor(staff);
  const params = await searchParams;

  const [users, stores, allClients] = await Promise.all([
    userRepository.list(),
    storeRepository.list(),
    clientRepository.list({
      ...(storeIds ? { storeIds } : {}),
      ...(brands ? { brands } : {}),
    }),
  ]);

  // BAs del scope del Gerente: BA del scope tienda + scope marca.
  const teamBas = users.filter((u) => {
    if (u.role !== "BA") return false;
    if (storeIds && !storeIds.includes(u.storeId!)) return false;
    if (brands && u.brand && !brands.includes(u.brand)) return false;
    return true;
  });
  if (teamBas.length === 0) notFound();

  // Calcular el inicio del mes en curso para ventas.
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // KPIs por BA — clientes asignados, tasks pendientes, ventas del mes.
  const baStats = await Promise.all(
    teamBas.map(async (ba) => {
      const [tasks, purchases] = await Promise.all([
        followupTaskRepository.listByBA(ba.id as unknown as StaffId, {
          status: "pending",
        }),
        purchaseRepository.list({ baId: ba.id as unknown as StaffId }),
      ]);
      const monthSales = purchases
        .filter((p) => new Date(p.at) >= monthStart)
        .reduce((acc, p) => acc + p.total, 0);
      const myClients = allClients.filter((c) =>
        c.assignedBaIds.includes(ba.id as unknown as StaffId),
      );
      return {
        baId: ba.id as unknown as string,
        name: ba.name,
        brand: ba.brand ?? null,
        storeId: ba.storeId ?? null,
        monthlyTarget: ba.monthlyTarget ?? 0,
        clientsCount: myClients.length,
        pendingTasks: tasks.length,
        monthSales,
        clients: myClients,
      };
    }),
  );

  const storeLookup: Record<string, string> = {};
  for (const s of stores) storeLookup[s.id as unknown as string] = s.name;

  // BA seleccionada para drill-down. Default al primero.
  const selectedBaId =
    typeof params.ba === "string" && baStats.some((b) => b.baId === params.ba)
      ? params.ba
      : (baStats[0]?.baId ?? null);

  return (
    <section className="flex flex-col gap-4">
      <SectionHeader title="Equipo" eyebrow="Mi tienda" />
      <TeamScreen
        team={baStats.map((b) => ({
          baId: b.baId,
          name: b.name,
          brand: b.brand,
          storeName: b.storeId ? (storeLookup[b.storeId] ?? b.storeId) : "—",
          monthlyTarget: b.monthlyTarget,
          clientsCount: b.clientsCount,
          pendingTasks: b.pendingTasks,
          monthSales: b.monthSales,
        }))}
        clientsByBa={Object.fromEntries(
          baStats.map((b) => [
            b.baId,
            b.clients.map((c) => ({
              id: c.id as unknown as string,
              name: c.name,
              email: c.email,
              phone: c.phone,
              brands: c.brands,
              tier: c.tier,
              lastPurchase: c.stats.lastPurchase,
              ltv: c.stats.ltv,
            })),
          ]),
        )}
        selectedBaId={selectedBaId}
      />
    </section>
  );
}

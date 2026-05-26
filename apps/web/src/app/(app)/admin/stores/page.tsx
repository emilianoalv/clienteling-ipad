import { SectionHeader } from "@/components/patterns";
import { StoresScreen } from "@/features/admin/components/stores-screen";
import { requireSession } from "@/server/auth/session";
import { storeRepository } from "@/server/repositories/store.repository";

/**
 * /admin/stores — CRUD de tiendas. RF-55 + RNF-14/16: el Admin gestiona
 * tiendas a nivel nacional desde la UI, no editando seed a mano. Los
 * cambios persisten en memoria del server con `persistent`.
 */
export default async function AdminStoresPage() {
  const { staff } = await requireSession();
  if (staff.role !== "Admin") {
    throw new Error("Esta vista solo está disponible para el rol Admin.");
  }
  const stores = await storeRepository.list();
  return (
    <section className="flex flex-col gap-4">
      <SectionHeader title="Tiendas" eyebrow="Configuración" />
      <StoresScreen stores={stores} />
    </section>
  );
}

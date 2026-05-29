import { SectionHeader } from "@/components/patterns";
import { SampleStockScreen } from "@/features/gerente/components/sample-stock-screen";
import { brandScopeFor } from "@/server/auth/scope";
import { requireSession } from "@/server/auth/session";
import { sampleRepository } from "@/server/repositories/sample.repository";

/**
 * /gerente/sample-stock — gestión del inventario de muestras de la
 * tienda. A diferencia del stock comercial (que llega del POS por
 * RF-22), las muestras no se venden y no entran/salen por integración.
 * La Gerente registra los lotes recibidos y corrige tras conteo
 * físico semanal.
 *
 * Filtrado por las marcas que ve la Gerente. El INVENTORY hoy es
 * global por cadena (no per-store) — para multi-zona habrá que
 * particionar, pero por ahora todas las Gerentes del scope ven el
 * mismo pool.
 */
export default async function GerenteSampleStockPage() {
  const { staff } = await requireSession();
  if (staff.role !== "Gerente") {
    throw new Error("Esta vista solo está disponible para el rol Gerente.");
  }
  const brands = brandScopeFor(staff);
  const inventory = await sampleRepository.listInventory(
    brands ? { brands } : {},
  );
  return (
    <section className="flex flex-col gap-4">
      <SectionHeader title="Stock de muestras" eyebrow="Mi tienda" />
      <SampleStockScreen inventory={inventory} />
    </section>
  );
}

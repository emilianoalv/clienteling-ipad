import { SectionHeader } from "@/components/patterns";
import { SampleStockScreen } from "@/features/gerente/components/sample-stock-screen";
import { brandScopeFor } from "@/server/auth/scope";
import { requireSession } from "@/server/auth/session";
import { productRepository } from "@/server/repositories/product.repository";
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
  const [inventory, products] = await Promise.all([
    sampleRepository.listInventory(brands ? { brands } : {}),
    productRepository.list(brands ? { brands } : {}),
  ]);

  // Reverse lookup sampleSku → image. Los SKUs de mini (LC-GEN-7) no
  // coinciden con los del producto comercial (LC-GEN-50), así que
  // resolvemos por el campo `product.sampleSku`.
  const imageBySampleSku: Record<string, string> = {};
  for (const p of products) {
    if (p.sampleSku && p.image) {
      imageBySampleSku[p.sampleSku as unknown as string] = p.image;
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <SectionHeader title="Stock de muestras" eyebrow="Mi tienda" />
      <SampleStockScreen
        inventory={inventory}
        imageBySampleSku={imageBySampleSku}
      />
    </section>
  );
}

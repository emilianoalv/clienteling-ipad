import { SectionHeader } from "@/components/patterns";
import { CatalogScreen } from "@/features/admin/components/catalog-screen";
import { requireSession } from "@/server/auth/session";
import { productRepository } from "@/server/repositories/product.repository";

/**
 * /admin/catalog — CRUD del catálogo nacional. RF-17 + RF-55: el
 * equipo de Marketing CRM mantiene los SKUs (línea, precio, categoría,
 * lifecycle) desde la UI. Stock por tienda y atributos finos
 * (concerns, piel, ingredientes activos, ficha técnica) no se editan
 * aquí — stock viene del POS (RF-22), atributos finos son Sprint 2.
 */
export default async function AdminCatalogPage() {
  const { staff } = await requireSession();
  if (staff.role !== "Admin") {
    throw new Error("Esta vista solo está disponible para el rol Admin.");
  }
  const products = await productRepository.list();
  return (
    <section className="flex flex-col gap-4">
      <SectionHeader title="Catálogo" eyebrow="Configuración" />
      <CatalogScreen products={products} />
    </section>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/primitives";
import { fetchClient } from "@/features/clients";
import { SampleDetail } from "@/features/clients/components/sample-detail";
import { productRepository } from "@/server/repositories/product.repository";
import { productTechRepository } from "@/server/repositories/product-tech.repository";
import { sampleRepository } from "@/server/repositories/sample.repository";
import { storeRepository } from "@/server/repositories/store.repository";
import { requireSession } from "@/server/auth/session";
import { brandScopeFor } from "@/server/auth/scope";
import type { SampleId } from "@/types/sample";
import type { Product } from "@/types/product";

/**
 * Espejo read-only de /ba/clients/[id]/samples/[sampleId] para Supervisor.
 */
export default async function SupervisorSampleDetailPage({
  params,
}: {
  params: Promise<{ clientId: string; sampleId: string }>;
}) {
  const { clientId, sampleId } = await params;
  const { staff } = await requireSession();

  const sample = await sampleRepository.findById(sampleId as SampleId);
  if (!sample || sample.clientId !== clientId) notFound();

  const [client, products, techs, store] = await Promise.all([
    fetchClient(clientId, staff),
    productRepository.list({ brands: brandScopeFor(staff) }),
    productTechRepository.list(),
    storeRepository.findById(sample.storeId),
  ]);

  const fullProduct =
    products.find(
      (p) =>
        p.sampleSku &&
        (p.sampleSku as unknown as string) === (sample.sku as unknown as string),
    ) ?? null;
  const fullProductTech = fullProduct ? techs.get(fullProduct.sku) ?? null : null;

  const productLookup: Record<string, Product> = {};
  for (const p of products) productLookup[p.sku as unknown as string] = p;

  return (
    <section className="flex flex-col gap-4">
      <nav
        aria-label="Breadcrumb"
        className="inline-flex items-center gap-2 text-[14.5px] font-medium"
      >
        <Link
          href={`/supervisor/clients/${clientId}/samples`}
          className="inline-flex items-center gap-1.5 text-ink hover:text-ink/80"
        >
          <Icon name="arrow-left" size={14} />
          Historial de muestras
        </Link>
        <span className="text-ink/40">/</span>
        <span className="text-ink/60">Detalle</span>
      </nav>

      <SampleDetail
        client={client}
        sample={sample}
        fullProduct={fullProduct}
        fullProductTech={fullProductTech}
        baName={staff.name}
        storeName={store?.name ?? "—"}
        productLookup={productLookup}
        basePath="/supervisor/clients"
      />
    </section>
  );
}

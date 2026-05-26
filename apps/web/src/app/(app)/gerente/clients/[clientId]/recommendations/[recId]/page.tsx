import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/primitives";
import { fetchClient } from "@/features/clients";
import { RecommendationDetail } from "@/features/clients/components/recommendation-detail";
import { productRepository } from "@/server/repositories/product.repository";
import { productTechRepository } from "@/server/repositories/product-tech.repository";
import { recommendationRepository } from "@/server/repositories/recommendation.repository";
import { storeRepository } from "@/server/repositories/store.repository";
import { requireSession } from "@/server/auth/session";
import { brandScopeFor } from "@/server/auth/scope";
import type { RecommendationId } from "@/types/recommendation";
import type { Product, Sku } from "@/types/product";

/**
 * Espejo read-only de /ba/clients/[id]/recommendations/[recId] para Gerente.
 */
export default async function GerenteRecommendationDetailPage({
  params,
}: {
  params: Promise<{ clientId: string; recId: string }>;
}) {
  const { clientId, recId } = await params;
  const { staff } = await requireSession();

  const recommendation = await recommendationRepository.findById(recId as RecommendationId);
  if (!recommendation || recommendation.clientId !== clientId) notFound();

  const [client, products, techs, store] = await Promise.all([
    fetchClient(clientId, staff),
    productRepository.list({ brands: brandScopeFor(staff) }),
    productTechRepository.list(),
    storeRepository.findById(recommendation.storeId),
  ]);

  const productBySku: Record<string, Product> = {};
  for (const p of products) productBySku[p.sku as Sku] = p;

  return (
    <section className="flex flex-col gap-4">
      <nav
        aria-label="Breadcrumb"
        className="inline-flex items-center gap-2 text-[14.5px] font-medium"
      >
        <Link
          href={`/gerente/clients/${clientId}/recommendations`}
          className="inline-flex items-center gap-1.5 text-ink hover:text-ink/80"
        >
          <Icon name="arrow-left" size={14} />
          Historial de recomendaciones
        </Link>
        <span className="text-ink/40">/</span>
        <span className="text-ink/60">Detalle</span>
      </nav>

      <RecommendationDetail
        client={client}
        recommendation={recommendation}
        baName={staff.name}
        storeName={store?.name ?? "—"}
        productBySku={productBySku}
        techs={techs}
        basePath="/gerente/clients"
      />
    </section>
  );
}

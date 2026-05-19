import Link from "next/link";
import { Icon } from "@/components/primitives";
import { fetchClient } from "@/features/clients";
import { RecommendationHistory } from "@/features/clients/components/recommendation-history";
import { productRepository } from "@/server/repositories/product.repository";
import { recommendationRepository } from "@/server/repositories/recommendation.repository";
import { requireSession } from "@/server/auth/session";
import { brandScopeFor } from "@/server/auth/scope";
import type { ClientId } from "@/types/client";
import type { Product, Sku } from "@/types/product";

export default async function ClientRecommendationsPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const { staff } = await requireSession();
  const [client, recommendations, products] = await Promise.all([
    fetchClient(clientId, staff),
    recommendationRepository.listByClient(clientId as ClientId),
    productRepository.list({ brands: brandScopeFor(staff) }),
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
          href={`/ba/clients/${clientId}`}
          className="inline-flex items-center gap-1.5 text-ink hover:text-ink/80"
        >
          <Icon name="arrow-left" size={14} />
          Volver al perfil
        </Link>
      </nav>

      <RecommendationHistory
        clientId={clientId}
        clientName={client.name}
        recommendations={recommendations}
        productBySku={productBySku}
      />
    </section>
  );
}

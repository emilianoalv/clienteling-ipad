import Link from "next/link";
import { Icon } from "@/components/primitives";
import { fetchClient } from "@/features/clients";
import { SampleHistory } from "@/features/clients/components/sample-history";
import { productRepository } from "@/server/repositories/product.repository";
import { sampleRepository } from "@/server/repositories/sample.repository";
import { requireSession } from "@/server/auth/session";
import { brandScopeFor } from "@/server/auth/scope";
import type { ClientId } from "@/types/client";
import type { Product } from "@/types/product";

/**
 * Espejo read-only de /ba/clients/[id]/samples para Gerente.
 */
export default async function GerenteSamplesPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const { staff } = await requireSession();
  const [client, samples, products] = await Promise.all([
    fetchClient(clientId, staff),
    sampleRepository.listByClient(clientId as ClientId),
    productRepository.list({ brands: brandScopeFor(staff) }),
  ]);

  const productBySampleSku: Record<string, Product> = {};
  for (const p of products) {
    if (p.sampleSku) productBySampleSku[p.sampleSku as unknown as string] = p;
  }

  return (
    <section className="flex flex-col gap-4">
      <nav
        aria-label="Breadcrumb"
        className="inline-flex items-center gap-2 text-[14.5px] font-medium"
      >
        <Link
          href={`/gerente/clients/${clientId}`}
          className="inline-flex items-center gap-1.5 text-ink hover:text-ink/80"
        >
          <Icon name="arrow-left" size={14} />
          Volver al perfil
        </Link>
      </nav>

      <SampleHistory
        clientId={clientId}
        clientName={client.name}
        samples={samples}
        productBySampleSku={productBySampleSku}
        basePath="/gerente/clients"
      />
    </section>
  );
}

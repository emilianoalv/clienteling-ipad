import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/primitives";
import { fetchClient } from "@/features/clients";
import { PurchaseDetail } from "@/features/clients/components/purchase-detail";
import { productRepository } from "@/server/repositories/product.repository";
import { purchaseRepository } from "@/server/repositories/purchase.repository";
import { storeRepository } from "@/server/repositories/store.repository";
import { requireSession } from "@/server/auth/session";
import { homeStoreFor } from "@/server/auth/scope";
import type { PurchaseId } from "@/types/purchase";
import type { Product, Sku } from "@/types/product";

export default async function PurchaseDetailPage({
  params,
}: {
  params: Promise<{ clientId: string; purchaseId: string }>;
}) {
  const { clientId, purchaseId } = await params;
  const { staff } = await requireSession();

  const purchase = await purchaseRepository.findById(purchaseId as PurchaseId);
  if (!purchase || purchase.clientId !== clientId) notFound();

  const storeId = homeStoreFor(staff);
  const [client, products, store] = await Promise.all([
    // fetchClient enforces the scope-404 — if the BA can see the client, they
    // can see all of that client's purchase history (per the cross-store rule).
    fetchClient(clientId, staff),
    productRepository.list({ brands: staff.brands }),
    storeId ? storeRepository.findById(storeId) : Promise.resolve(null),
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
          href={`/ba/clients/${clientId}/purchases`}
          className="inline-flex items-center gap-1.5 text-ink hover:text-ink/80"
        >
          <Icon name="arrow-left" size={14} />
          Historial de compras
        </Link>
        <span className="text-ink/40">/</span>
        <span className="text-ink/60">Detalle</span>
      </nav>

      <PurchaseDetail
        client={client}
        purchase={purchase}
        baName={staff.name}
        storeName={store?.name ?? "—"}
        productBySku={productBySku}
      />
    </section>
  );
}

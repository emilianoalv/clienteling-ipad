import Link from "next/link";
import { Icon } from "@/components/primitives";
import { fetchClient, RegisterSaleForm } from "@/features/clients";
import { productRepository } from "@/server/repositories/product.repository";
import { storeRepository } from "@/server/repositories/store.repository";
import { requireSession } from "@/server/auth/session";
import type { StoreId } from "@/types/store";

export default async function RegisterSalePage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const { staff } = await requireSession();
  const storeId = "storeId" in staff ? (staff.storeId as StoreId) : null;
  const [client, products, store] = await Promise.all([
    fetchClient(clientId),
    productRepository.list({ brands: staff.brands }),
    storeId ? storeRepository.findById(storeId) : Promise.resolve(null),
  ]);

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
          <strong>{client.name}</strong>
        </Link>
        <span className="text-ink/40">/</span>
        <span className="text-ink/60">Registrar venta</span>
      </nav>

      <RegisterSaleForm
        client={client}
        products={products}
        baName={staff.name}
        storeName={store?.name ?? "—"}
      />
    </section>
  );
}

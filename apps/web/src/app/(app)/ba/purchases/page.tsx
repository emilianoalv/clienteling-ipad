import { getTranslations } from "next-intl/server";
import { SectionHeader } from "@/components/patterns";
import { PurchasesList, listPurchases } from "@/features/purchases";
import { listClients } from "@/features/clients";
import { listProducts } from "@/features/catalog";
import { requireSession } from "@/server/auth/session";
import { storeScopeFor } from "@/server/auth/scope";
import type { Sku } from "@/types/product";

export default async function PurchasesPage() {
  const t = await getTranslations();
  const { staff } = await requireSession();
  const scope = storeScopeFor(staff);

  const [purchases, clients, products] = await Promise.all([
    listPurchases({ brands: staff.brands, storeIds: scope }),
    listClients({ brands: staff.brands, storeIds: scope }),
    listProducts({}),
  ]);

  const clientLookup = Object.fromEntries(clients.map((c) => [c.id, c.name]));
  const productLookup = Object.fromEntries(
    products.map((p) => [p.sku, { line: p.line }]),
  ) as Record<Sku, { line: string }>;

  return (
    <section className="flex flex-col gap-4">
      <SectionHeader title={t("purchases.title")} eyebrow={t("rail.purchases")} />
      <PurchasesList
        purchases={purchases}
        clientLookup={clientLookup}
        productLookup={productLookup}
      />
    </section>
  );
}

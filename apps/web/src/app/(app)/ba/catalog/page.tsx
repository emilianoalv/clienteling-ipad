import { getTranslations } from "next-intl/server";
import { SectionHeader } from "@/components/patterns";
import { CatalogBrowser, listProducts, listStores } from "@/features/catalog";
import { requireSession } from "@/server/auth/session";
import { brandScopeFor, homeStoreFor } from "@/server/auth/scope";
import type { StoreId } from "@/types/store";

export default async function CatalogPage() {
  const t = await getTranslations();
  const { staff } = await requireSession();
  const [products, stores] = await Promise.all([
    listProducts({ brands: brandScopeFor(staff) }),
    listStores(),
  ]);

  const sessionStoreId = homeStoreFor(staff);
  const primaryStoreId =
    sessionStoreId && stores.some((s) => s.id === sessionStoreId)
      ? sessionStoreId
      : stores[0]?.id ?? ("st-pol" as StoreId);

  return (
    <section className="flex flex-col gap-4">
      <SectionHeader title={t("catalog.title")} eyebrow={t("rail.catalog")} />
      <CatalogBrowser
        products={products}
        stores={stores}
        primaryStoreId={primaryStoreId}
      />
    </section>
  );
}

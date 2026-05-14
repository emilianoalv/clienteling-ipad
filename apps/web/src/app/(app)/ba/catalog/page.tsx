import { getTranslations } from "next-intl/server";
import { SectionHeader } from "@/components/patterns";
import { CatalogBrowser, listProducts, listStores } from "@/features/catalog";
import { requireSession } from "@/server/auth/session";
import type { StoreId } from "@/types/store";

export default async function CatalogPage() {
  const t = await getTranslations();
  const { staff } = await requireSession();
  const [products, stores] = await Promise.all([
    listProducts({ brands: staff.brands }),
    listStores(),
  ]);

  const sessionStoreId = "storeId" in staff ? (staff.storeId as StoreId) : null;
  const primaryStoreId =
    sessionStoreId && stores.some((s) => s.id === sessionStoreId)
      ? sessionStoreId
      : stores[0]?.id ?? ("st-polanco" as StoreId);

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

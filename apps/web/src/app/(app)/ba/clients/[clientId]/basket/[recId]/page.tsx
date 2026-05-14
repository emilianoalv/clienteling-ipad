import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/primitives";
import { SectionHeader } from "@/components/patterns";
import { Basket, fetchBasketContext } from "@/features/consultation";
import { requireSession } from "@/server/auth/session";

export default async function BasketPage({
  params,
}: {
  params: Promise<{ clientId: string; recId: string }>;
}) {
  const { clientId, recId } = await params;
  const { staff } = await requireSession();
  const [{ client, recommendation, productLookup }, t] = await Promise.all([
    fetchBasketContext(clientId, recId),
    getTranslations(),
  ]);

  return (
    <section className="flex flex-col gap-4">
      <SectionHeader
        title={t("basket.title")}
        eyebrow={client.name}
        right={
          <Link
            href={`/ba/clients/${client.id}`}
            className="inline-flex items-center gap-1.5 text-ink/60 hover:text-ink"
          >
            <Icon name="arrow-left" size={14} /> {t("app.back")}
          </Link>
        }
      />
      <Basket
        recommendation={recommendation}
        client={client}
        baLabel={staff.name}
        productLookup={productLookup}
        staffRole={staff.role}
      />
    </section>
  );
}

import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/primitives";
import { SectionHeader } from "@/components/patterns";
import { fetchClient, RegisterSaleForm } from "@/features/clients";
import { productRepository } from "@/server/repositories/product.repository";
import { requireSession } from "@/server/auth/session";

export default async function RegisterSalePage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const { staff } = await requireSession();
  const [client, products, t] = await Promise.all([
    fetchClient(clientId),
    productRepository.list({ brands: staff.brands }),
    getTranslations(),
  ]);

  return (
    <section>
      <SectionHeader
        title={t("profile.actions.register_sale")}
        eyebrow={client.name}
        right={
          <Link
            href={`/ba/clients/${clientId}`}
            className="inline-flex items-center gap-1.5 text-ink/60 hover:text-ink"
          >
            <Icon name="arrow-left" size={14} /> {t("app.back")}
          </Link>
        }
      />
      <RegisterSaleForm client={client} products={products} />
    </section>
  );
}

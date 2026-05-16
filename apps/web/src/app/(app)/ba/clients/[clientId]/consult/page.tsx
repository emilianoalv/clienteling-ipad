import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/primitives";
import { SectionHeader } from "@/components/patterns";
import { ConsultationWizard, fetchConsultationContext } from "@/features/consultation";
import { requireSession } from "@/server/auth/session";

export default async function ConsultationPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const { staff } = await requireSession();
  const [{ client, products }, t] = await Promise.all([
    fetchConsultationContext(clientId, staff),
    getTranslations(),
  ]);

  return (
    <section className="flex flex-col gap-4">
      <SectionHeader
        title={t("consultation.title")}
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
      <ConsultationWizard client={client} products={products} brandScope={staff.brands} />
    </section>
  );
}

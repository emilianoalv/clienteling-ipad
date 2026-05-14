import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/primitives";
import { SectionHeader } from "@/components/patterns";
import { fetchClient, RegisterVisitForm } from "@/features/clients";

export default async function RegisterVisitPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const client = await fetchClient(clientId);
  const t = await getTranslations();

  return (
    <section>
      <SectionHeader
        title={t("profile.actions.register_visit")}
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
      <RegisterVisitForm client={client} />
    </section>
  );
}

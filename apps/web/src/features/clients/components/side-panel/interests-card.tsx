import { getTranslations } from "next-intl/server";
import type { Client } from "@/types/client";
import { Card, KvRow, SectionHeader } from "@/components/patterns";
import { Chip } from "@/components/primitives";

export async function InterestsCard({ client }: { client: Client }) {
  const t = await getTranslations();
  return (
    <Card>
      <SectionHeader title={t("profile.card.interests")} />
      <KvRow label={t("capture.field.routine")} value={client.routine} />
      <div className="flex flex-wrap gap-1.5 mt-2">
        {client.interests.map((i) => (
          <Chip key={i} size="sm">
            {i}
          </Chip>
        ))}
      </div>
      {client.affinities.length > 0 ? (
        <div className="mt-3">
          <span className="text-[14.5px] font-semibold leading-none tracking-[0.12em] uppercase text-ink/60">
            {t("profile.card.affinities")}
          </span>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {client.affinities.map((a) => (
              <Chip key={a} size="sm">
                {a}
              </Chip>
            ))}
          </div>
        </div>
      ) : null}
    </Card>
  );
}

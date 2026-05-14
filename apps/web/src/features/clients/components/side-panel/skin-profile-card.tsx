import { getTranslations } from "next-intl/server";
import type { Client } from "@/types/client";
import { Card, KvRow, SectionHeader } from "@/components/patterns";
import { Chip, Icon } from "@/components/primitives";

export async function SkinProfileCard({ client }: { client: Client }) {
  const t = await getTranslations();
  return (
    <Card>
      <SectionHeader title={t("profile.card.skin_profile")} />
      <KvRow label={t("capture.field.skin_type")} value={client.skin.type} />
      <KvRow label={t("capture.field.skin_tone")} value={client.skin.tone} />
      <div className="flex flex-wrap gap-1.5 mt-2">
        {client.skin.concerns.map((concern) => (
          <Chip key={concern} size="sm">
            {concern}
          </Chip>
        ))}
      </div>
      {client.allergies.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {client.allergies.map((a) => (
            <Chip key={a} variant="danger" size="sm" leading={<Icon name="warning" size={12} />}>
              {a}
            </Chip>
          ))}
        </div>
      ) : null}
    </Card>
  );
}

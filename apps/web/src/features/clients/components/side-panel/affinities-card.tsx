import { getTranslations } from "next-intl/server";
import type { Client } from "@/types/client";
import { Card } from "@/components/patterns";
import { Icon } from "@/components/primitives";

export async function AffinitiesCard({ client }: { client: Client }) {
  const t = await getTranslations();
  const affinities = client.affinities;

  return (
    <Card>
      <span className="text-[15px] font-semibold tracking-[0.12em] uppercase text-ink/60">
        {t("profile.card.affinities")}
      </span>
      {affinities.length === 0 ? (
        <p className="mt-3 m-0 text-[16px] font-medium leading-snug text-ink/60">
          Aún no hay afinidades. Se irán acumulando con compras y consultas.
        </p>
      ) : (
        <ul className="list-none m-0 mt-3 p-0 flex flex-col gap-2">
          {affinities.map((a) => (
            <li key={a} className="inline-flex items-center gap-2.5 text-[16px]">
              <Icon name="heart" size={14} />
              <span>{a}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

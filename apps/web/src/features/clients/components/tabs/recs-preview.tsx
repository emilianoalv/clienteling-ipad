"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { Recommendation } from "@/types/recommendation";
import { Chip, Icon } from "@/components/primitives";
import { formatDate } from "@/lib/format/format-date";

export interface RecsPreviewProps {
  recommendations: readonly Recommendation[];
  clientId: string;
}

const PREVIEW_COUNT = 4;

/**
 * Inline preview shown inside the client-profile "Recomendaciones" tab.
 * Each row is a clickable link to the recommendation detail page. The full
 * history lives at `/ba/clients/[id]/recommendations`.
 */
export function RecsPreview({ recommendations, clientId }: RecsPreviewProps) {
  const t = useTranslations();
  if (recommendations.length === 0) {
    return (
      <p className="m-0 text-[16px] font-medium leading-normal text-ink/60">
        {t("profile.empty.recs")}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <header className="flex items-baseline justify-between gap-3 flex-wrap">
        <div>
          <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
            Historial de recomendaciones
          </div>
          <p className="m-0 mt-1 text-[14.5px] text-ink/60 leading-snug">
            Productos sugeridos a la clienta y su estado de conversión.
          </p>
        </div>
        <Link
          href={`/ba/clients/${clientId}/recommendations`}
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md border border-line bg-white text-[14px] font-semibold text-ink no-underline transition-colors hover:bg-bone"
        >
          Ver todo
          <Icon name="arrow-right" size={13} />
        </Link>
      </header>

      <ul className="list-none m-0 p-0 flex flex-col">
        {recommendations.slice(0, PREVIEW_COUNT).map((r) => (
          <li key={r.id} className="border-b border-line last:border-b-0">
            <Link
              href={`/ba/clients/${clientId}/recommendations/${r.id}`}
              className="grid grid-cols-[40px_minmax(0,1fr)_auto_auto] items-center gap-3.5 py-3.5 px-1 text-ink no-underline transition-colors hover:bg-bone/60 rounded-md"
            >
              <span
                aria-hidden
                className="inline-flex w-10 h-10 items-center justify-center rounded-md bg-bone text-ink/60"
              >
                <Icon name="sparkle" size={18} />
              </span>
              <div className="min-w-0 flex flex-col gap-1">
                <span className="text-[15px] font-semibold leading-tight">
                  {r.items.length} {r.items.length === 1 ? "producto" : "productos"} recomendados
                </span>
                <span className="text-[13.5px] text-ink/60 leading-tight truncate">
                  {r.items.join(" · ")}
                </span>
              </div>
              <RecStatusChip status={r.status} />
              <span className="text-[13.5px] text-ink/60 leading-none whitespace-nowrap">
                {formatDate(r.at)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RecStatusChip({ status }: { status: Recommendation["status"] }) {
  if (status === "converted") {
    return (
      <Chip variant="ok" size="sm">
        Comprada
      </Chip>
    );
  }
  if (status === "dismissed") {
    return (
      <Chip variant="danger" size="sm">
        Descartada
      </Chip>
    );
  }
  return (
    <Chip variant="warn" size="sm">
      Pendiente de compra
    </Chip>
  );
}

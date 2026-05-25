"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { Sample } from "@/types/sample";
import { BrandTag, Chip, Icon } from "@/components/primitives";
import { formatDate } from "@/lib/format/format-date";

export interface SamplesPreviewProps {
  samples: readonly Sample[];
  clientId: string;
}

const PREVIEW_COUNT = 4;

/**
 * Inline preview shown inside the client-profile "Muestras" tab.
 * Each row is a clickable link to the sample detail page. The full history
 * lives at `/ba/clients/[id]/samples`.
 */
export function SamplesPreview({ samples, clientId }: SamplesPreviewProps) {
  const t = useTranslations();
  if (samples.length === 0) {
    return (
      <p className="m-0 text-[16px] font-medium leading-normal text-ink/60">
        {t("profile.empty.samples")}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <header className="flex items-baseline justify-between gap-3 flex-wrap">
        <div>
          <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
            Historial de muestras
          </div>
          <p className="m-0 mt-1 text-[14.5px] text-ink/60 leading-snug">
            Productos sampleados al cliente — entrega, conversión y seguimiento.
          </p>
        </div>
        <Link
          href={`/ba/clients/${clientId}/samples`}
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md border border-line bg-white text-[14px] font-semibold text-ink no-underline transition-colors hover:bg-bone"
        >
          Ver todo
          <Icon name="arrow-right" size={13} />
        </Link>
      </header>

      <ul className="list-none m-0 p-0 flex flex-col">
        {samples.slice(0, PREVIEW_COUNT).map((s) => (
          <li key={s.id} className="border-b border-line last:border-b-0">
            <Link
              href={`/ba/clients/${clientId}/samples/${s.id}`}
              className="grid grid-cols-[40px_minmax(0,1fr)_auto_auto] items-center gap-3.5 py-3.5 px-1 text-ink no-underline transition-colors hover:bg-bone/60 rounded-md"
            >
              <span
                aria-hidden
                className="inline-flex w-10 h-10 items-center justify-center rounded-md bg-bone text-ink/60"
              >
                <Icon name="gift" size={18} />
              </span>
              <div className="min-w-0 flex flex-col gap-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[15px] font-semibold leading-tight">{s.name}</span>
                  <BrandTag brand={s.brand} alwaysShow />
                </div>
                <span className="text-[13.5px] text-ink/60 leading-tight truncate">
                  SKU {s.sku}
                </span>
              </div>
              {s.converted ? (
                <Chip variant="ok" size="sm">
                  Convertida en venta
                </Chip>
              ) : (
                <Chip variant="warn" size="sm">
                  Pendiente de feedback
                </Chip>
              )}
              <span className="text-[13.5px] text-ink/60 leading-none whitespace-nowrap">
                {formatDate(s.givenAt)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

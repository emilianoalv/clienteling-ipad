"use client";

import { useTranslations } from "next-intl";
import type { Sample } from "@/types/sample";
import { Chip, Icon } from "@/components/primitives";
import { formatDate } from "@/lib/format/format-date";

export interface SamplesPreviewProps {
  samples: readonly Sample[];
}

export function SamplesPreview({ samples }: SamplesPreviewProps) {
  const t = useTranslations();
  if (samples.length === 0) {
    return (
      <p className="m-0 text-[16px] font-medium leading-normal text-ink/60">
        {t("profile.empty.samples")}
      </p>
    );
  }

  return (
    <ul className="list-none m-0 p-0 flex flex-col">
      {samples.slice(0, 4).map((s) => (
        <li
          key={s.id}
          className="grid grid-cols-[36px_1fr_auto_auto] items-center gap-3 py-3 border-b border-dashed border-line last:border-b-0"
        >
          <span
            aria-hidden
            className="inline-flex w-9 h-9 items-center justify-center rounded-full bg-bone text-ink/60"
          >
            <Icon name="gift" />
          </span>
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[16px] font-semibold leading-snug text-ink">{s.name}</span>
            <span className="text-xs font-medium leading-snug text-ink/60">SKU {s.sku}</span>
          </div>
          <Chip variant={s.converted ? "ok" : "warn"} size="sm">
            {s.converted ? "Convertida" : "Pendiente"}
          </Chip>
          <span className="text-xs font-medium leading-none text-ink/60">{formatDate(s.givenAt)}</span>
        </li>
      ))}
    </ul>
  );
}

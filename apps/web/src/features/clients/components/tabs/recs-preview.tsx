"use client";

import { useTranslations } from "next-intl";
import type { Recommendation } from "@/types/recommendation";
import { Chip, Icon } from "@/components/primitives";
import { formatDate } from "@/lib/format/format-date";

export interface RecsPreviewProps {
  recommendations: readonly Recommendation[];
}

export function RecsPreview({ recommendations }: RecsPreviewProps) {
  const t = useTranslations();
  if (recommendations.length === 0) {
    return (
      <p className="m-0 text-[16px] font-medium leading-normal text-ink/60">
        {t("profile.empty.recs")}
      </p>
    );
  }

  return (
    <ul className="list-none m-0 p-0 flex flex-col">
      {recommendations.slice(0, 4).map((r) => (
        <li
          key={r.id}
          className="grid grid-cols-[36px_1fr_auto_auto] items-center gap-3 py-3 border-b border-dashed border-line last:border-b-0"
        >
          <span
            aria-hidden
            className="inline-flex w-9 h-9 items-center justify-center rounded-full bg-bone text-ink/60"
          >
            <Icon name="sparkle" />
          </span>
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[16px] font-semibold leading-snug text-ink">
              {r.items.length} producto(s)
            </span>
            <span className="text-xs font-medium leading-snug text-ink/60 whitespace-nowrap overflow-hidden text-ellipsis">
              {r.items.join(" · ")}
            </span>
          </div>
          <Chip
            variant={r.status === "converted" ? "ok" : r.status === "dismissed" ? "danger" : "warn"}
            size="sm"
          >
            {r.status === "converted"
              ? "Convertida"
              : r.status === "dismissed"
                ? "Descartada"
                : "Pendiente"}
          </Chip>
          <span className="text-xs font-medium leading-none text-ink/60">{formatDate(r.at)}</span>
        </li>
      ))}
    </ul>
  );
}

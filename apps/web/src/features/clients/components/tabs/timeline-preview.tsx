"use client";

import { useTranslations } from "next-intl";
import type { Interaction } from "@/types/interaction";
import { BrandTag, Icon } from "@/components/primitives";
import { formatDate } from "@/lib/format/format-date";

const INTERACTION_ICON = {
  consultation: "sparkle",
  purchase: "bag",
  sample: "gift",
  whatsapp: "whatsapp",
  appointment: "calendar",
  discovery: "eye",
  return: "x",
  courtesy: "heart",
  followup: "message",
} as const;

export interface TimelinePreviewProps {
  interactions: readonly Interaction[];
}

export function TimelinePreview({ interactions }: TimelinePreviewProps) {
  const t = useTranslations();
  if (interactions.length === 0) {
    return (
      <p className="m-0 text-[16px] font-medium leading-normal text-ink/60">
        {t("profile.empty.timeline")}
      </p>
    );
  }

  return (
    <ul className="list-none m-0 p-0 flex flex-col">
      {interactions.slice(0, 4).map((i) => (
        <li
          key={i.id}
          className="grid grid-cols-[36px_1fr_auto_auto] items-center gap-3 py-3 border-b border-dashed border-line last:border-b-0"
        >
          <span
            aria-hidden
            className="inline-flex w-9 h-9 items-center justify-center rounded-full bg-bone text-ink/60"
          >
            <Icon name={INTERACTION_ICON[i.kind]} />
          </span>
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[16px] font-semibold leading-snug text-ink">
              {t(`visit.kind.${VISIT_KEY[i.kind]}` as Parameters<typeof t>[0])}
            </span>
            {i.notes ? (
              <span className="text-xs font-medium leading-snug text-ink/60 whitespace-nowrap overflow-hidden text-ellipsis">
                {i.notes}
              </span>
            ) : null}
          </div>
          <BrandTag brand={i.brand} alwaysShow />
          <span className="text-xs font-medium leading-none text-ink/60">{formatDate(i.at)}</span>
        </li>
      ))}
    </ul>
  );
}

const VISIT_KEY: Record<Interaction["kind"], string> = {
  consultation: "consultation",
  purchase: "purchase",
  sample: "sample",
  whatsapp: "followup",
  appointment: "consultation",
  discovery: "consultation",
  return: "return",
  courtesy: "courtesy",
  followup: "followup",
};

"use client";

import { useT } from "@/lib/i18n/use-t";
import type { Channel, Communication } from "@/types/communication";
import { BrandTag, Chip, Icon } from "@/components/primitives";
import type { IconName } from "@/types/icon";
import { Card, EmptyState } from "@/components/patterns";

const CHANNEL_ICON: Record<Channel, IconName> = {
  WhatsApp: "whatsapp",
  Email: "email",
  SMS: "sms",
};

export interface CommLogProps {
  communications: readonly Communication[];
  clientLookup: Readonly<Record<string, string>>;
  title?: string;
  eyebrow?: string;
  compact?: boolean;
}

export function CommLog({ communications, clientLookup, title, eyebrow, compact }: CommLogProps) {
  const t = useT();

  if (communications.length === 0) {
    return <EmptyState title={t("comm.empty.title")} description={t("comm.empty.description")} />;
  }

  return (
    <Card variant={compact ? "flat" : "luxe"} className="flex flex-col gap-4">
      {(title || eyebrow) && !compact ? (
        <header>
          {eyebrow ? (
            <span className="text-[15px] font-semibold tracking-[0.12em] uppercase text-ink/60">
              {eyebrow}
            </span>
          ) : null}
          {title ? (
            <h2 className="m-0 font-display text-[28px] leading-tight tracking-[-0.005em]">
              {title}
            </h2>
          ) : null}
        </header>
      ) : null}

      <ul className="list-none m-0 p-0">
        {communications.map((c) => {
          const clientName = clientLookup[c.clientId] ?? t("comm.unknown_client");
          const outbound = c.direction === "outbound";
          return (
            <li
              key={c.id}
              className="grid grid-cols-[32px_1fr_auto] gap-3 items-start py-3.5 border-b border-line last:border-b-0"
            >
              <span className="inline-flex w-8 h-8 items-center justify-center rounded-full bg-bone">
                <Icon name={CHANNEL_ICON[c.channel]} size={14} />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-[16px] font-semibold leading-tight">{clientName}</span>
                  <Chip size="sm">{c.channel}</Chip>
                  <Chip size="sm" variant={outbound ? "neutral" : "ok"}>
                    {t(outbound ? "comm.outbound" : "comm.inbound")}
                  </Chip>
                  {c.brand ? <BrandTag brand={c.brand} alwaysShow /> : null}
                </div>
                <div className="text-[16px] leading-snug text-ink">{c.body}</div>
                <div className="text-[15px] font-medium leading-snug text-ink/60 mt-1">
                  {formatDateTime(c.at)} · {t(`comm.status.${c.status}`)}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function formatDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("es-MX", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

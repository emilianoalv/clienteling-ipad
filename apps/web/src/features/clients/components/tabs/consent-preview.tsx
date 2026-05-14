"use client";

import type { Consent } from "@/types/consent";
import type { Channel } from "@/types/communication";
import { Chip, Icon } from "@/components/primitives";
import { formatDate } from "@/lib/format/format-date";

const CHANNELS: readonly Channel[] = ["WhatsApp", "Email", "SMS"];

export interface ConsentPreviewProps {
  consents: readonly Consent[];
}

export function ConsentPreview({ consents }: ConsentPreviewProps) {
  return (
    <ul className="list-none m-0 p-0 flex flex-col">
      {CHANNELS.map((channel) => {
        const c = consents.find((x) => x.channel === channel);
        const status = c?.status ?? "revoked";
        const icon = channel === "WhatsApp" ? "whatsapp" : channel === "Email" ? "email" : "sms";
        return (
          <li
            key={channel}
            className="grid grid-cols-[36px_1fr_auto_auto] items-center gap-3 py-3 border-b border-dashed border-line last:border-b-0"
          >
            <span
              aria-hidden
              className="inline-flex w-9 h-9 items-center justify-center rounded-full bg-bone text-ink/60"
            >
              <Icon name={icon} />
            </span>
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-[16px] font-semibold leading-snug text-ink">{channel}</span>
              {c ? (
                <span className="text-xs font-medium leading-snug text-ink/60">
                  Versión {c.version} · {c.source}
                </span>
              ) : null}
            </div>
            <Chip variant={status === "granted" ? "ok" : "danger"} size="sm">
              {status === "granted" ? "Otorgado" : "Revocado"}
            </Chip>
            <span className="text-xs font-medium leading-none text-ink/60">
              {c ? formatDate(c.at) : "—"}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

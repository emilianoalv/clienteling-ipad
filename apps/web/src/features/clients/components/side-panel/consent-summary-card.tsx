import { getTranslations } from "next-intl/server";
import type { Consent } from "@/types/consent";
import type { Channel } from "@/types/communication";
import type { IconName } from "@/types/icon";
import { Card } from "@/components/patterns";
import { Chip, Icon } from "@/components/primitives";

const CHANNELS: readonly Channel[] = ["SMS", "Email", "WhatsApp"];

const CHANNEL_ICON: Record<Channel, IconName> = {
  SMS: "sms",
  Email: "email",
  WhatsApp: "whatsapp",
};

export async function ConsentSummaryCard({ consents }: { consents: readonly Consent[] }) {
  const t = await getTranslations();

  return (
    <Card>
      <div className="flex items-baseline justify-between">
        <span className="text-[15px] font-semibold tracking-[0.12em] uppercase text-ink/60">
          {t("profile.card.consent_summary")}
        </span>
        <span className="text-[15px] font-medium leading-none text-ink/60">
          {t("profile.consent.notice_version", { version: "v2026.03" })}
        </span>
      </div>
      <div className="mt-3 flex flex-col">
        {CHANNELS.map((ch) => {
          const latest = latestForChannel(consents, ch);
          const granted = latest?.status === "granted";
          return (
            <div
              key={ch}
              className="grid grid-cols-[28px_1fr_auto] items-center gap-3 py-2 border-b border-dashed border-line last:border-b-0"
            >
              <Icon name={CHANNEL_ICON[ch]} size={16} />
              <div className="min-w-0">
                <div className="text-[16px] font-semibold leading-tight">{ch}</div>
                <div className="text-[15px] font-medium leading-tight text-ink/60">
                  {latest ? `${latest.version} · ${formatDate(latest.at)}` : t("profile.consent.no_record")}
                </div>
              </div>
              <Chip variant={granted ? "ok" : "danger"} size="sm">
                {granted ? t("profile.consent.granted") : t("profile.consent.revoked")}
              </Chip>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function latestForChannel(consents: readonly Consent[], channel: Channel): Consent | null {
  const matches = consents.filter((c) => c.channel === channel);
  if (matches.length === 0) return null;
  return matches.reduce<Consent>(
    (acc, c) => (new Date(c.at) > new Date(acc.at) ? c : acc),
    matches[0]!,
  );
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

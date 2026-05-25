import { getTranslations } from "next-intl/server";
import type { Client } from "@/types/client";
import { Card, SectionHeader } from "@/components/patterns";
import { listUpcomingEvents } from "../../services/list-upcoming-events";

const EVENT_GLYPH = {
  birthday: "🎂",
  anniversary: "★",
} as const;

const EVENT_KEY = {
  birthday: "birthday",
  anniversary: "anniversary",
} as const;

export async function UpcomingEventsCard({ client }: { client: Client }) {
  const t = await getTranslations();
  const events = listUpcomingEvents(client, { windowDays: 60 }).slice(0, 4);

  return (
    <Card>
      <SectionHeader title={t("profile.card.upcoming_events")} />
      {events.length === 0 ? (
        <p className="m-0 text-[16px] font-medium leading-snug text-ink/60">Sin eventos próximos.</p>
      ) : (
        <ul className="list-none m-0 p-0 flex flex-col gap-2">
          {events.map((event) => (
            <li
              key={`${event.kind}-${event.date}`}
              className="grid grid-cols-[32px_1fr] gap-3 items-center px-3 py-2 bg-bone rounded-md"
            >
              <span aria-hidden className="text-xl text-center">
                {EVENT_GLYPH[event.kind]}
              </span>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-[16px] font-semibold leading-tight">
                  {t(`event.${EVENT_KEY[event.kind]}`)}
                </span>
                <span className="text-xs font-medium leading-none text-ink/60">
                  {relativeWhen(event.daysUntil, (k, params) =>
                    t(`event.${k}` as Parameters<typeof t>[0], params),
                  )}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function relativeWhen(
  days: number,
  tx: (k: string, params?: Record<string, string | number>) => string,
) {
  if (days === 0) return tx("today");
  if (days === 1) return tx("tomorrow");
  if (days > 0) return tx("in_days", { days });
  return tx("days_ago", { days: Math.abs(days) });
}

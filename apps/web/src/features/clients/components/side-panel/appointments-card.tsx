import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { Appointment, AppointmentStatus } from "@/types/appointment";
import { Card } from "@/components/patterns";
import { Icon } from "@/components/primitives";

const ACTIVE_STATUSES: readonly AppointmentStatus[] = ["scheduled", "confirmed", "rescheduled"];

const STATUS_COLOR: Record<AppointmentStatus, string> = {
  scheduled: "text-warn",
  confirmed: "text-ok",
  rescheduled: "text-warn",
  completed: "text-ink/60",
  cancelled: "text-err",
  "no-show": "text-err",
};

export async function AppointmentsCard({
  appointments,
  basePath = "/ba/clients",
}: {
  appointments: readonly Appointment[];
  /** Prefijo de ruta para deep-links. Default `/ba/clients`. */
  basePath?: string;
}) {
  const t = await getTranslations();
  const cutoff = Date.now() - 86_400_000;

  const upcoming = appointments
    .filter((a) => ACTIVE_STATUSES.includes(a.status) && new Date(a.at).getTime() >= cutoff)
    .sort((a, b) => a.at.localeCompare(b.at));
  const past = appointments
    .filter((a) => a.status === "completed" || new Date(a.at).getTime() < cutoff)
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 2);

  return (
    <Card>
      <div className="mb-2.5">
        <span className="text-[15px] font-semibold tracking-[0.12em] uppercase text-ink/60">
          {t("profile.card.appointments")}
        </span>
      </div>

      {upcoming.length === 0 ? (
        <p className="m-0 text-[16px] font-medium leading-snug text-ink/60">
          {t("profile.appointments.empty")}
        </p>
      ) : (
        <ul className="list-none m-0 p-0 flex flex-col gap-2.5">
          {upcoming.slice(0, 3).map((a) => (
            <li key={a.id}>
              <Link
                href={`${basePath}/${a.clientId}/appointments/${a.id}`}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-md bg-bone hover:bg-bone/70 text-ink no-underline transition-colors"
              >
                <div className="min-w-[56px]">
                  <div className="text-[16px] font-semibold leading-none tabular">
                    {formatTime(a.at)}
                  </div>
                  <div className="text-[14px] font-medium leading-tight text-ink/60">
                    {formatDate(a.at)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[16.5px] font-semibold leading-tight truncate">
                    {t(`appointment.kind.${a.kind}`)}
                  </div>
                  <div className="text-[14.5px] font-medium leading-tight text-ink/60">
                    {a.durationMin} min · {a.brand}
                  </div>
                </div>
                <span
                  className={`text-[13.5px] font-semibold uppercase tracking-[0.04em] ${STATUS_COLOR[a.status]}`}
                >
                  {t(`appointment.status.${a.status}`)}
                </span>
              </Link>
            </li>
          ))}
          {upcoming.length > 3 ? (
            <li className="text-[15px] font-medium leading-snug text-ink/60">
              {t("calendar.more_count", { count: upcoming.length - 3 })}
            </li>
          ) : null}
        </ul>
      )}

      {past.length > 0 ? (
        <>
          <hr className="my-3 border-0 border-t border-dashed border-line" />
          <div className="text-[15px] font-medium leading-snug text-ink/60 mb-1.5">
            {t("profile.appointments.past")}
          </div>
          <ul className="list-none m-0 p-0">
            {past.map((a) => (
              <li key={a.id}>
                <Link
                  href={`${basePath}/${a.clientId}/appointments/${a.id}`}
                  className="flex items-center gap-2 py-1 text-[15.5px] text-ink no-underline hover:text-ink/70 transition-colors"
                >
                  <Icon name="check" size={11} />
                  <span className="flex-1 truncate">{t(`appointment.kind.${a.kind}`)}</span>
                  <span className="text-[14.5px] text-ink/60">{formatDate(a.at)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </Card>
  );
}

function formatTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("es-MX", { hour: "2-digit", minute: "2-digit" }).format(
      new Date(iso),
    );
  } catch {
    return iso;
  }
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short" }).format(
      new Date(iso),
    );
  } catch {
    return iso;
  }
}

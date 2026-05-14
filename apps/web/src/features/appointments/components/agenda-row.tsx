"use client";

import { useTranslations } from "next-intl";
import { Avatar, BrandTag, Chip } from "@/components/primitives";
import type { Appointment } from "@/types/appointment";
import { cn } from "@/lib/cn";

export interface AgendaRowProps {
  appointment: Appointment;
  clientName: string;
  onClick?: () => void;
  className?: string;
}

const STATUS_TONE = {
  scheduled: "warn",
  confirmed: "ok",
  completed: "neutral",
  rescheduled: "warn",
  cancelled: "danger",
  "no-show": "danger",
} as const;

export function AgendaRow({ appointment, clientName, onClick, className }: AgendaRowProps) {
  const t = useTranslations();
  const at = new Date(appointment.at);
  const hh = at.getHours().toString().padStart(2, "0");
  const mm = at.getMinutes().toString().padStart(2, "0");

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "grid grid-cols-[84px_36px_1fr_auto_auto] items-center gap-3 w-full p-3 bg-white border border-line rounded-md text-left text-inherit cursor-pointer transition-[background-color,border-color] duration-100 ease-luxe hover:bg-bone hover:border-ink/[0.12]",
        className,
      )}
    >
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold leading-none tabular text-ink">
          {hh}:{mm}
        </span>
        <span className="text-[15px] font-medium leading-none text-ink/60">
          {appointment.durationMin} min
        </span>
      </div>
      <Avatar initials={initials(clientName)} size={36} />
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-[16px] font-semibold leading-snug text-ink whitespace-nowrap overflow-hidden text-ellipsis">
          {clientName}
        </span>
        <span className="text-xs font-medium leading-snug text-ink/60">
          {t(`appointment.kind.${appointment.kind}`)}
        </span>
      </div>
      <BrandTag brand={appointment.brand} alwaysShow />
      <Chip variant={STATUS_TONE[appointment.status]} size="sm">
        {t(`appointment.status.${appointment.status}`)}
      </Chip>
    </button>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0] ?? "")
    .join("")
    .toUpperCase();
}

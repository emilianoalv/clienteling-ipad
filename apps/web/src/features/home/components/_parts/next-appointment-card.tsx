"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/primitives";
import type { NextAppointmentBriefing } from "../../services/get-ba-day-snapshot";

const TICK_MS = 30_000; // re-render cada 30 s para actualizar la cuenta regresiva
const REFRESH_MS = 120_000; // pedir snapshot fresco al server cada 2 min

export interface NextAppointmentCardProps {
  briefing: NextAppointmentBriefing;
}

/**
 * Hero card que aparece arriba del dashboard cuando la BA tiene una cita en
 * las próximas 2 h (o lleva menos de 30 min de retraso). Cumple RF-30 con
 * cobertura "in-app prominente" — el AppointmentReminders.tsx ya dispara
 * notificación nativa del navegador 15 min antes; este card complementa
 * con contexto pre-cita visible permanentemente mientras la app esté
 * abierta.
 *
 * Actualización en vivo:
 *  - tick local cada 30 s para que la cuenta regresiva baje sin esperar
 *  - router.refresh() cada 2 min para re-pedir el snapshot al server por
 *    si entró una cita nueva o cambió un status
 */
export function NextAppointmentCard({ briefing }: NextAppointmentCardProps) {
  const router = useRouter();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const tick = window.setInterval(() => setNow(Date.now()), TICK_MS);
    const refresh = window.setInterval(() => router.refresh(), REFRESH_MS);
    return () => {
      window.clearInterval(tick);
      window.clearInterval(refresh);
    };
  }, [router]);

  const apptMs = Date.parse(briefing.appointment.at);
  const diffMin = Math.round((apptMs - now) / 60_000);
  const isOngoing = diffMin <= 0;
  const apptTime = formatTime(briefing.appointment.at);
  const apptKindLabel = APPOINTMENT_KIND_LABEL[briefing.appointment.kind] ?? "Cita";

  return (
    <article
      className={`flex flex-col gap-3.5 p-5 rounded-xl border-2 ${
        isOngoing
          ? "bg-warn/[0.06] border-warn/40"
          : "bg-ink text-paper border-ink"
      }`}
    >
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div className="inline-flex items-center gap-2.5">
          <span
            aria-hidden
            className={`inline-flex w-10 h-10 items-center justify-center rounded-full ${
              isOngoing ? "bg-warn/20 text-warn" : "bg-paper/15 text-paper"
            }`}
          >
            <Icon name={isOngoing ? "warning" : "bell"} size={18} />
          </span>
          <div>
            <div
              className={`text-[13px] font-semibold tracking-[0.12em] uppercase ${
                isOngoing ? "text-warn" : "text-paper/70"
              }`}
            >
              {isOngoing
                ? `Cita en curso · ${Math.abs(diffMin)} min de retraso`
                : countdownLabel(diffMin)}
            </div>
            <h2
              className={`m-0 mt-0.5 font-display text-[24px] leading-tight tracking-[-0.01em] ${
                isOngoing ? "text-ink" : "text-paper"
              }`}
            >
              {briefing.clientName}
            </h2>
          </div>
        </div>
        <span
          className={`text-[15px] font-semibold tabular leading-none ${
            isOngoing ? "text-ink/80" : "text-paper/85"
          }`}
        >
          {apptKindLabel} · {apptTime}
        </span>
      </header>

      {/* Briefing chips */}
      <div className="flex flex-wrap gap-2">
        {briefing.lastPurchase ? (
          <BriefChip
            icon="bag"
            label="Última compra"
            value={`${briefing.lastPurchase.line} · ${relativeDay(briefing.lastPurchase.atIso, now)}`}
            tone={isOngoing ? "light" : "dark"}
          />
        ) : (
          <BriefChip
            icon="bag"
            label="Última compra"
            value="Aún no registra compras"
            tone={isOngoing ? "light" : "dark"}
            muted
          />
        )}
        {briefing.pendingTasksWithClient > 0 ? (
          <BriefChip
            icon="message"
            label="Seguimientos"
            value={`${briefing.pendingTasksWithClient} pendiente${briefing.pendingTasksWithClient === 1 ? "" : "s"}`}
            tone={isOngoing ? "light" : "dark"}
          />
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href={`/ba/clients/${briefing.clientId}`}
          className={`inline-flex items-center gap-1.5 h-10 px-4 rounded-md text-[15px] font-semibold no-underline transition-colors ${
            isOngoing
              ? "bg-ink text-paper hover:bg-ink/90"
              : "bg-paper text-ink hover:bg-paper/90"
          }`}
        >
          Abrir perfil
          <Icon name="arrow-right" size={13} />
        </Link>
        {briefing.pendingTasksWithClient > 0 ? (
          <Link
            href={`/ba/clients/${briefing.clientId}?tab=followup`}
            className={`inline-flex items-center gap-1.5 h-10 px-4 rounded-md text-[15px] font-semibold no-underline border transition-colors ${
              isOngoing
                ? "border-ink/30 text-ink hover:bg-ink/5"
                : "border-paper/30 text-paper hover:bg-paper/10"
            }`}
          >
            Ver seguimientos
          </Link>
        ) : null}
      </div>
    </article>
  );
}

function BriefChip({
  icon,
  label,
  value,
  tone,
  muted = false,
}: {
  icon: "bag" | "message";
  label: string;
  value: string;
  tone: "dark" | "light";
  muted?: boolean;
}) {
  const isDark = tone === "dark";
  const bg = isDark ? "bg-paper/10" : "bg-white/70";
  const labelColor = isDark
    ? muted
      ? "text-paper/40"
      : "text-paper/60"
    : muted
      ? "text-ink/40"
      : "text-ink/55";
  const valueColor = isDark
    ? muted
      ? "text-paper/60"
      : "text-paper"
    : muted
      ? "text-ink/55"
      : "text-ink";
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md ${bg}`}>
      <span aria-hidden className={labelColor}>
        <Icon name={icon} size={13} />
      </span>
      <span className={`text-[12.5px] font-semibold uppercase tracking-[0.06em] ${labelColor}`}>
        {label}
      </span>
      <span className={`text-[14px] font-medium ${valueColor}`}>{value}</span>
    </div>
  );
}

function countdownLabel(diffMin: number): string {
  if (diffMin <= 1) return "Llega en cualquier momento";
  if (diffMin <= 60) return `Llega en ${diffMin} min`;
  const h = Math.floor(diffMin / 60);
  const m = diffMin % 60;
  if (m === 0) return `Llega en ${h} h`;
  return `Llega en ${h} h ${m} min`;
}

function formatTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function relativeDay(iso: string, nowMs: number): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "—";
  const days = Math.round((nowMs - t) / 86_400_000);
  if (days <= 0) return "hoy";
  if (days === 1) return "ayer";
  if (days < 7) return `hace ${days} días`;
  if (days < 30) return `hace ${Math.round(days / 7)} sem`;
  if (days < 365) return `hace ${Math.round(days / 30)} meses`;
  return `hace ${Math.round(days / 365)} años`;
}

// Labels de tipo de cita — minimal subset, los enums viven en types/appointment.
// Si llega un kind que no está aquí, se cae al fallback "Cita".
const APPOINTMENT_KIND_LABEL: Record<string, string> = {
  ritual: "Servicio de cabina",
  makeup: "Maquillaje",
  diagnosis: "Diagnóstico",
  consultation: "Consulta",
  "vip-cabin": "Cabina VIP",
  facial: "Facial",
  "anniversary-event": "Evento aniversario",
  "product-followup": "Seguimiento producto",
  "fragrance-consult": "Consulta de fragancia",
  other: "Cita",
};

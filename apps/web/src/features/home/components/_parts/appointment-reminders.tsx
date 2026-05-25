"use client";

import { useEffect, useState } from "react";
import type { AgendaItem } from "../../services/get-ba-day-snapshot";
import { Icon } from "@/components/primitives";

const LEAD_MIN = 15;
const STORAGE_KEY = "clienteling.reminders.fired.v1";

interface RemindersBannerProps {
  today: readonly AgendaItem[];
}

type PermissionState = "unsupported" | "default" | "granted" | "denied";

/**
 * RF-30 · recordatorios proactivos. Programa una notificación nativa del
 * navegador 15 min antes de cada cita del día. Usa la Notification API
 * (no Service Worker) — vive mientras la pestaña esté abierta, que es lo
 * normal en el iPad de la BA durante el turno.
 *
 * Idempotente entre tabs/reloads vía localStorage: una vez disparada una
 * notificación para un appointment, no se vuelve a disparar.
 */
export function AppointmentReminders({ today }: RemindersBannerProps) {
  const [perm, setPerm] = useState<PermissionState>("default");

  useEffect(() => {
    if (typeof Notification === "undefined") {
      setPerm("unsupported");
      return;
    }
    setPerm(Notification.permission as PermissionState);
  }, []);

  useEffect(() => {
    if (perm !== "granted") return;
    const fired = readFired();
    const timers: number[] = [];
    const now = Date.now();

    for (const { appointment, clientName } of today) {
      const apptMs = Date.parse(appointment.at);
      if (Number.isNaN(apptMs)) continue;
      const fireAt = apptMs - LEAD_MIN * 60_000;
      if (fireAt <= now) continue; // ya pasó la ventana de aviso
      if (fired.has(appointment.id)) continue;

      const delay = fireAt - now;
      const id = window.setTimeout(() => {
        fireNotification(clientName, appointment.at);
        markFired(appointment.id);
      }, delay);
      timers.push(id);
    }

    return () => {
      for (const id of timers) window.clearTimeout(id);
    };
  }, [perm, today]);

  async function requestPermission() {
    if (typeof Notification === "undefined") return;
    const next = await Notification.requestPermission();
    setPerm(next as PermissionState);
  }

  const upcoming = today.filter((a) => Date.parse(a.appointment.at) > Date.now());
  if (upcoming.length === 0 && perm !== "denied") return null;

  if (perm === "unsupported") return null;

  if (perm === "granted") {
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-ok/[0.08] border border-ok/25 text-ok text-[14px] font-semibold self-start">
        <Icon name="check" size={16} />
        Recordatorios activos · te avisaré {LEAD_MIN} min antes ({upcoming.length}{" "}
        {upcoming.length === 1 ? "cita" : "citas"} hoy)
      </div>
    );
  }

  if (perm === "denied") {
    return (
      <div className="inline-flex items-start gap-2 px-4 py-2.5 rounded-md bg-warn/[0.08] border border-warn/25 text-[14px] self-start">
        <Icon name="warning" size={16} />
        <div>
          <strong className="text-warn">Recordatorios bloqueados.</strong>{" "}
          <span className="text-ink/70">
            Activa las notificaciones del navegador para recibir avisos antes de cada cita.
          </span>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={requestPermission}
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-ink text-white text-[14px] font-semibold cursor-pointer hover:bg-ink/90 self-start"
    >
      <Icon name="bell" size={16} />
      Activar recordatorios de citas
    </button>
  );
}

function fireNotification(clientName: string, atIso: string) {
  if (typeof Notification === "undefined") return;
  const at = new Date(atIso);
  const hh = at.getHours().toString().padStart(2, "0");
  const mm = at.getMinutes().toString().padStart(2, "0");
  const body = `Cita con ${clientName} a las ${hh}:${mm}.`;
  try {
    new Notification("Próxima cita en 15 min", {
      body,
      tag: `appt-${atIso}`,
      silent: false,
    });
  } catch {
    // El navegador puede rechazar (focus loss, throttling). No es crítico.
  }
}

function readFired(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((x): x is string => typeof x === "string"));
  } catch {
    return new Set();
  }
}

function markFired(id: string) {
  if (typeof window === "undefined") return;
  try {
    const fired = readFired();
    fired.add(id);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(fired)));
  } catch {
    // localStorage puede estar lleno o deshabilitado; no romper la app.
  }
}

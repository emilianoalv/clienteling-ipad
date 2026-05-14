"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Avatar, type AvatarTone, Button, Chip, Input } from "@/components/primitives";
import { Card, SectionHeader } from "@/components/patterns";
import { BRAND_IDS, type BrandId } from "@/types/brand";
import type { Client } from "@/types/client";
import type { Appointment } from "@/types/appointment";
import type { StaffId } from "@/types/staff";
import { createAppointment } from "../actions/create-appointment";
import { APPOINTMENT_KINDS, type NewAppointmentInput } from "../schemas/new-appointment.schema";
import { AvailabilityGrid } from "./availability-grid";
import { AppointmentSummaryCard } from "./appointment-summary-card";
import { ClientInsightsCard } from "./client-insights-card";

export interface NewAppointmentFormProps {
  clients: readonly Client[];
  defaultBaId: StaffId;
  baOptions: ReadonlyArray<{ id: StaffId; label: string }>;
  existingAppointments: readonly Appointment[];
}

export function NewAppointmentForm({
  clients,
  defaultBaId,
  baOptions,
  existingAppointments,
}: NewAppointmentFormProps) {
  const t = useTranslations();
  const [query, setQuery] = useState("");
  const [clientId, setClientId] = useState<string | null>(null);
  const [kind, setKind] = useState<NewAppointmentInput["kind"]>("consultation");
  const [brand, setBrand] = useState<BrandId>("Lancôme");
  const [baId, setBaId] = useState<StaffId>(defaultBaId);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [durationMin, setDurationMin] = useState(45);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return clients.slice(0, 6);
    return clients
      .filter((c) => `${c.name} ${c.email} ${c.phone}`.toLowerCase().includes(needle))
      .slice(0, 6);
  }, [clients, query]);

  const client = clientId ? clients.find((c) => c.id === clientId) ?? null : null;

  function onSubmit() {
    setError(null);
    if (!client) return setError("Selecciona una clienta");
    if (!date || !time) return setError("Selecciona fecha y hora");

    const input: NewAppointmentInput = {
      clientId: client.id,
      baId,
      brand,
      date,
      time,
      durationMin,
      kind,
      ...(notes ? { notes } : {}),
    };
    startTransition(async () => {
      const result = await createAppointment(input);
      if (result && !result.ok) setError(result.message ?? "Error al guardar");
    });
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_320px] gap-5 items-start">
      <div className="flex flex-col gap-4">
        <Card variant="luxe">
          <SectionHeader title={t("appointment.field.client")} />
          {client ? (
            <div className="grid grid-cols-[40px_1fr_auto] gap-3 items-center">
              <Avatar initials={initials(client.name)} tone={brandToTone(client.brands[0])} />
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-sm font-semibold leading-tight">{client.name}</span>
                <span className="text-xs font-medium leading-snug text-ink/60">
                  {client.phone} · {client.email}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setClientId(null)}>
                {t("app.change")}
              </Button>
            </div>
          ) : (
            <>
              <Input
                placeholder={t("clients.search")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <ul className="list-none m-0 mt-3 p-0 flex flex-col gap-2">
                {matches.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setClientId(c.id);
                        if (c.brands[0]) setBrand(c.brands[0]);
                      }}
                      className="grid grid-cols-[32px_1fr] gap-3 items-center p-2 bg-bone border border-line rounded-md cursor-pointer text-left text-inherit w-full hover:bg-bone-2"
                    >
                      <Avatar initials={initials(c.name)} size={32} tone={brandToTone(c.brands[0])} />
                      <div>
                        <span className="block text-sm font-semibold leading-tight">{c.name}</span>
                        <span className="text-xs font-medium leading-snug text-ink/60">
                          {c.email}
                        </span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>

        <Card variant="luxe">
          <SectionHeader title={t("appointment.field.kind")} />
          <div className="flex flex-wrap gap-1.5 mb-4">
            {APPOINTMENT_KINDS.map((k) => (
              <ChipBtn key={k} active={kind === k} onClick={() => setKind(k)}>
                {t(`appointment.kind.${k}`)}
              </ChipBtn>
            ))}
          </div>

          <SectionHeader title={t("appointment.field.brand")} />
          <div className="flex flex-wrap gap-1.5 mb-4">
            {BRAND_IDS.filter((b) => b === "Lancôme" || b === "YSL").map((b) => (
              <ChipBtn key={b} active={brand === b} onClick={() => setBrand(b)}>
                {b}
              </ChipBtn>
            ))}
          </div>

          <SectionHeader title={t("appointment.field.ba")} />
          <div className="flex flex-wrap gap-1.5">
            {baOptions.map((b) => (
              <ChipBtn key={b.id} active={baId === b.id} onClick={() => setBaId(b.id)}>
                {b.label}
              </ChipBtn>
            ))}
          </div>
        </Card>

        <Card variant="luxe">
          <SectionHeader title={t("appointment.field.date")} />
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Input
              label={t("appointment.field.date")}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <Input
              label={t("appointment.field.duration")}
              type="number"
              min={15}
              step={15}
              value={String(durationMin)}
              onChange={(e) => setDurationMin(Math.max(15, Number(e.target.value)))}
            />
          </div>
          <SectionHeader title={t("appointment.field.time")} />
          <AvailabilityGrid
            date={date}
            baId={baId}
            durationMin={durationMin}
            existing={existingAppointments}
            value={time}
            onSelect={setTime}
          />
        </Card>

        <Card variant="luxe">
          <Input
            label={t("appointment.field.notes")}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Card>

        {error ? <p className="m-0 text-[16px] font-medium leading-snug text-err">{error}</p> : null}

        <div className="flex justify-end">
          <Button variant="primary" onClick={onSubmit} loading={isPending}>
            {t("appointment.submit")}
          </Button>
        </div>
      </div>

      <aside className="sticky top-4 flex flex-col gap-4">
        <AppointmentSummaryCard
          clientName={client?.name ?? null}
          kindLabel={t(`appointment.kind.${kind}`)}
          brand={brand}
          baLabel={baOptions.find((b) => b.id === baId)?.label ?? "—"}
          date={date}
          time={time}
          durationMin={durationMin}
        />
        {client ? <ClientInsightsCard client={client} /> : null}
      </aside>
    </div>
  );
}

function ChipBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="bg-transparent border-0 p-0 cursor-pointer"
    >
      <Chip variant={active ? "accent" : "neutral"} size="sm">
        {children}
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

function brandToTone(brand: BrandId | undefined): AvatarTone {
  if (brand === "Lancôme") return "lancome";
  if (brand === "YSL") return "ysl";
  return "default";
}

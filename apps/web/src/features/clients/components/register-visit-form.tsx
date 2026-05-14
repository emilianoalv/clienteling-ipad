"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button, Chip, Input } from "@/components/primitives";
import { Card } from "@/components/patterns";
import type { Client } from "@/types/client";
import { BRAND_IDS, type BrandId } from "@/types/brand";
import { registerVisit } from "../actions/register-visit";
import {
  VISIT_KINDS,
  VISIT_REASONS,
  type RegisterVisitInput,
} from "../schemas/register-visit.schema";

export interface RegisterVisitFormProps {
  client: Client;
}

export function RegisterVisitForm({ client }: RegisterVisitFormProps) {
  const t = useTranslations();
  const [kind, setKind] = useState<RegisterVisitInput["kind"]>("consultation");
  const [reason, setReason] = useState<RegisterVisitInput["reason"]>("skincare-consult");
  const [brand, setBrand] = useState<BrandId>(client.brands[0] ?? "Lancôme");
  const [amount, setAmount] = useState<string>("");
  const [duration, setDuration] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isPending, startTransition] = useTransition();

  const requiresAmount = kind === "purchase" || kind === "return";

  function onSubmit() {
    const input: RegisterVisitInput = {
      clientId: client.id,
      kind,
      reason,
      brand,
      ...(notes ? { notes } : {}),
      ...(amount ? { amount: Number(amount) } : {}),
      ...(duration ? { durationMin: Number(duration) } : {}),
    };
    startTransition(async () => {
      const result = await registerVisit(input);
      if (result && !result.ok) setErrors(result.fieldErrors ?? {});
    });
  }

  return (
    <Card variant="luxe" className="flex flex-col gap-5 max-w-[720px]">
      <ChipFieldset label={t("visit.field.kind")}>
        {VISIT_KINDS.map((k) => (
          <ChipBtn key={k} active={kind === k} onClick={() => setKind(k)}>
            {t(`visit.kind.${k}`)}
          </ChipBtn>
        ))}
      </ChipFieldset>

      <ChipFieldset label={t("visit.field.reason")}>
        {VISIT_REASONS.map((r) => (
          <ChipBtn key={r} active={reason === r} onClick={() => setReason(r)} size="sm">
            {t(`visit.reason.${r}`)}
          </ChipBtn>
        ))}
      </ChipFieldset>

      <ChipFieldset label={t("visit.field.brand")}>
        {BRAND_IDS.filter((b) => client.brands.includes(b) || b === "Lancôme" || b === "YSL").map(
          (b) => (
            <ChipBtn key={b} active={brand === b} onClick={() => setBrand(b)} size="sm">
              {b}
            </ChipBtn>
          ),
        )}
      </ChipFieldset>

      <div className="grid grid-cols-2 gap-4">
        {requiresAmount ? (
          <Input
            label={t("visit.field.amount")}
            type="number"
            min={0}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            {...(errors.amount?.[0] ? { error: errors.amount[0] } : {})}
          />
        ) : (
          <Input
            label={t("visit.field.duration")}
            type="number"
            min={0}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
        )}
        <Input
          label={t("visit.field.notes")}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <Button variant="primary" onClick={onSubmit} loading={isPending}>
        {t("visit.submit")}
      </Button>
    </Card>
  );
}

function ChipFieldset({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-2 border-0 p-0 m-0">
      <legend className="text-xs font-semibold leading-none tracking-[0.02em] text-ink/60 p-0">
        {label}
      </legend>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </fieldset>
  );
}

function ChipBtn({
  active,
  size = "md",
  onClick,
  children,
}: {
  active: boolean;
  size?: "sm" | "md";
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
      <Chip variant={active ? "accent" : "neutral"} size={size}>
        {children}
      </Chip>
    </button>
  );
}

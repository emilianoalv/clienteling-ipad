"use client";

import { useMemo, useState, useTransition } from "react";
import { useT } from "@/lib/i18n/use-t";
import type { BrandId } from "@/types/brand";
import type { Channel } from "@/types/communication";
import type { Client } from "@/types/client";
import type { Template } from "@/types/template";
import { Avatar, type AvatarTone, Button, Chip, Icon } from "@/components/primitives";
import type { IconName } from "@/types/icon";
import { Card } from "@/components/patterns";
import { renderTemplate } from "@/features/communications";
import { sendCommunication } from "@/features/communications";
import { TemplateList } from "./template-list";
import { WhatsappPreview } from "./whatsapp-preview";

const CHANNELS: ReadonlyArray<Channel> = ["WhatsApp", "Email", "SMS"];

const CHANNEL_ICON: Record<Channel, IconName> = {
  WhatsApp: "whatsapp",
  Email: "email",
  SMS: "sms",
};

const PRODUCT_PLACEHOLDER = "Libre Le Parfum Intense";

export interface ComposerProps {
  client: Client;
  templates: readonly Template[];
  staffName: string;
  storeName: string;
}

type BrandTab = "all" | BrandId;

export function Composer({ client, templates, staffName, storeName }: ComposerProps) {
  const t = useT();
  const [brandFilter, setBrandFilter] = useState<BrandTab>("all");
  const [template, setTemplate] = useState<Template | null>(templates[0] ?? null);
  const [channel, setChannel] = useState<Channel>(templates[0]?.channel ?? "WhatsApp");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  const body = useMemo(() => {
    if (!template) return "";
    return renderTemplate(template, {
      nombre: client.name.split(" ")[0] ?? client.name,
      tienda: storeName,
      ba: staffName.split(" ")[0] ?? staffName,
      producto: PRODUCT_PLACEHOLDER,
    });
  }, [template, client, storeName, staffName]);

  const tone: AvatarTone = brandToTone(client.brands[0]);

  function onSelectTemplate(tpl: Template) {
    setTemplate(tpl);
    setChannel(tpl.channel);
    setSent(false);
  }

  function onSend() {
    if (!template) return;
    setError(null);
    startTransition(async () => {
      const result = await sendCommunication({
        clientId: client.id,
        channel,
        body,
        brand: template.brand,
        templateId: template.id,
      });
      if (!result.ok) {
        setError(result.message ?? t("followup.error.send"));
        return;
      }
      setSent(true);
    });
  }

  return (
    <div className="grid grid-cols-[320px_minmax(0,1fr)_300px] gap-5 items-start">
      <TemplateList
        templates={templates}
        selectedId={template?.id ?? null}
        onSelect={onSelectTemplate}
        brand={brandFilter}
        onBrandChange={setBrandFilter}
      />

      <Card variant="luxe" className="flex flex-col gap-4">
        <header>
          <span className="text-[15px] font-semibold tracking-[0.12em] uppercase text-ink/60">
            {t("followup.composer")}
          </span>
          <h2 className="m-0 font-display text-[28px] leading-tight tracking-[-0.005em]">
            {template
              ? `${template.category} · ${template.brand}`
              : t("followup.no_template")}
          </h2>
        </header>

        <Card variant="flat" className="flex items-center gap-3 bg-bone border-transparent">
          <Avatar initials={initials(client.name)} tone={tone} size={40} />
          <div className="flex-1 min-w-0">
            <div className="text-[16px] font-semibold leading-tight truncate">{client.name}</div>
            <div className="text-[15px] font-medium leading-snug text-ink/60 truncate">
              {client.phone} · {t("followup.consent_hint")}
            </div>
          </div>
        </Card>

        <div>
          <span className="block text-[15px] font-semibold tracking-[0.12em] uppercase text-ink/60 mb-2">
            {t("followup.channel")}
          </span>
          <div className="flex gap-2">
            {CHANNELS.map((ch) => {
              const active = channel === ch;
              return (
                <Button
                  key={ch}
                  type="button"
                  size="sm"
                  variant={active ? "primary" : "default"}
                  leading={<Icon name={CHANNEL_ICON[ch]} size={12} />}
                  onClick={() => setChannel(ch)}
                  aria-pressed={active}
                >
                  {ch}
                </Button>
              );
            })}
          </div>
        </div>

        <div>
          <span className="block text-[15px] font-semibold tracking-[0.12em] uppercase text-ink/60 mb-2">
            {t("followup.body")}
          </span>
          <textarea
            value={body}
            readOnly
            className="w-full h-[140px] p-3.5 text-[17px] leading-snug rounded-[10px] border border-line bg-white resize-none"
          />
          {template ? (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {template.tokens.map((tok) => (
                <Chip key={tok} size="sm">
                  {tok}
                </Chip>
              ))}
            </div>
          ) : null}
        </div>

        <Card variant="flat" className="bg-ok/5 border-ok/20">
          <span className="text-[15px] font-semibold tracking-[0.12em] uppercase text-ok">
            {t("followup.sandbox.title")}
          </span>
          <p className="m-0 mt-1 text-[16px] font-medium leading-snug">
            {t("followup.sandbox.hint")}
          </p>
        </Card>

        {error ? (
          <p className="m-0 text-[16px] font-medium leading-snug text-err">{error}</p>
        ) : null}
        {sent ? (
          <p className="m-0 text-[16px] font-medium leading-snug text-ok">
            ✓ {t("followup.sent")}
          </p>
        ) : null}

        <footer className="flex justify-between gap-3">
          <Button variant="ghost" disabled aria-disabled="true">
            {t("followup.save_draft")}
          </Button>
          <Button
            variant="primary"
            onClick={onSend}
            loading={isPending}
            disabled={!template || sent}
            trailing={<Icon name="arrow-right" />}
          >
            {t("followup.send_now")}
          </Button>
        </footer>
      </Card>

      <WhatsappPreview
        body={body || t("followup.preview.fallback")}
        contactName={`${staffName.split(" ")[0] ?? staffName} · ${template?.brand ?? "Lancôme"}`}
        contactInitials={(staffName[0] ?? "B").toUpperCase()}
      />
    </div>
  );
}

function brandToTone(brand: string | undefined): AvatarTone {
  if (brand === "Lancôme") return "lancome";
  if (brand === "YSL") return "ysl";
  return "default";
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0] ?? "")
    .join("")
    .toUpperCase();
}

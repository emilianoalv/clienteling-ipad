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
import { Modal } from "@/components/feedback";
import { renderTemplate } from "@/features/communications";
import { sendCommunication } from "@/features/communications";
import { buildMessageUrl } from "@/lib/messaging/build-message-url";
import { TemplateList } from "./template-list";
import { WhatsappPreview } from "./whatsapp-preview";

const CHANNELS: ReadonlyArray<Channel> = ["WhatsApp", "Email", "SMS"];

const CHANNEL_ICON: Record<Channel, IconName> = {
  WhatsApp: "whatsapp",
  Email: "email",
  SMS: "sms",
};

const CHANNEL_LABEL: Record<Channel, string> = {
  WhatsApp: "WhatsApp",
  Email: "Mail",
  SMS: "Mensajes",
};

const PRODUCT_PLACEHOLDER = "Libre Le Parfum Intense";

export interface ComposerProps {
  client: Client;
  templates: readonly Template[];
  staffName: string;
  storeName: string;
}

type BrandTab = "all" | BrandId;
type SendPhase = "idle" | "pending-confirm" | "logging" | "sent";

export function Composer({ client, templates, staffName, storeName }: ComposerProps) {
  const t = useT();
  const [brandFilter, setBrandFilter] = useState<BrandTab>("all");
  const [template, setTemplate] = useState<Template | null>(templates[0] ?? null);
  const [channel, setChannel] = useState<Channel>(templates[0]?.channel ?? "WhatsApp");
  const [bodyDraft, setBodyDraft] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [phase, setPhase] = useState<SendPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const renderedBody = useMemo(() => {
    if (!template) return "";
    return renderTemplate(template, {
      nombre: client.name.split(" ")[0] ?? client.name,
      tienda: storeName,
      ba: staffName.split(" ")[0] ?? staffName,
      producto: PRODUCT_PLACEHOLDER,
    });
  }, [template, client, storeName, staffName]);

  const body = bodyDraft ?? renderedBody;
  const tone: AvatarTone = brandToTone(client.brands[0]);

  function onSelectTemplate(tpl: Template) {
    setTemplate(tpl);
    setChannel(tpl.channel);
    setBodyDraft(null);
    setIsEditing(false);
    setPhase("idle");
    setError(null);
  }

  function onOpenExternal() {
    if (!template) return;
    setError(null);
    const url = buildMessageUrl({
      channel,
      phone: client.phone,
      email: client.email,
      body,
      subject: `${template.category} · ${template.brand}`,
    });
    // Marcamos el composer en "pending-confirm" ANTES de abrir la app
    // externa. Cuando la BA vuelva a la app de clienteling, verá el
    // modal "¿Enviaste el mensaje?".
    setPhase("pending-confirm");
    // window.open con _blank en iPad sale al esquema nativo
    // (whatsapp://, mailto:, sms:) sin perder esta tab.
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function onConfirmSent() {
    if (!template) return;
    setError(null);
    setPhase("logging");
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
        setPhase("pending-confirm");
        return;
      }
      setPhase("sent");
    });
  }

  function onConfirmCancelled() {
    setPhase("idle");
  }

  function onComposeAgain() {
    setPhase("idle");
    setBodyDraft(null);
    setIsEditing(false);
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
              {client.phone} · {client.email}
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
                  disabled={phase !== "idle"}
                >
                  {ch}
                </Button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[15px] font-semibold tracking-[0.12em] uppercase text-ink/60">
              {t("followup.body")}
            </span>
            {phase === "idle" && template ? (
              <button
                type="button"
                onClick={() => setIsEditing((v) => !v)}
                className="text-[14px] font-medium text-ink/60 hover:text-ink underline-offset-2 hover:underline bg-transparent border-0 p-0 cursor-pointer"
              >
                {isEditing ? "Volver a plantilla" : "Editar mensaje"}
              </button>
            ) : null}
          </div>
          <textarea
            value={body}
            readOnly={!isEditing || phase !== "idle"}
            onChange={(e) => setBodyDraft(e.target.value)}
            className="w-full h-[140px] p-3.5 text-[17px] leading-snug rounded-[10px] border border-line bg-white resize-none focus-visible:border-ink outline-none"
          />
          {template && !isEditing ? (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {template.tokens.map((tok) => (
                <Chip key={tok} size="sm">
                  {tok}
                </Chip>
              ))}
            </div>
          ) : null}
        </div>

        <Card variant="flat" className="bg-bone border-line">
          <span className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
            ¿Cómo funciona?
          </span>
          <p className="m-0 mt-1 text-[15px] leading-snug text-ink/70">
            Al darle <strong className="text-ink">Abrir en {CHANNEL_LABEL[channel]}</strong> tu
            iPad cambia a la app correspondiente con el mensaje pre-cargado. Tú lo revisas y le
            das Enviar. Al volver, te preguntaremos si lo enviaste para registrarlo en el
            historial.
          </p>
        </Card>

        {error ? (
          <p className="m-0 text-[16px] font-medium leading-snug text-err">{error}</p>
        ) : null}

        {phase === "sent" ? (
          <div className="inline-flex items-center gap-2 px-4 py-3 bg-ok/[0.1] text-ok rounded-md text-[16px] font-semibold leading-none border border-ok/25 self-start">
            <Icon name="check" /> Mensaje registrado en el historial de {client.name.split(" ")[0]}.
          </div>
        ) : null}

        <footer className="flex justify-between gap-3 items-center">
          {phase === "sent" ? (
            <Button variant="ghost" onClick={onComposeAgain}>
              Componer otro mensaje
            </Button>
          ) : (
            <Button variant="ghost" disabled aria-disabled="true">
              {t("followup.save_draft")}
            </Button>
          )}
          {phase !== "sent" ? (
            <Button
              variant="primary"
              onClick={onOpenExternal}
              disabled={!template || phase !== "idle"}
              leading={<Icon name={CHANNEL_ICON[channel]} size={14} />}
              trailing={<Icon name="arrow-right" />}
            >
              Abrir en {CHANNEL_LABEL[channel]}
            </Button>
          ) : null}
        </footer>
      </Card>

      <WhatsappPreview
        body={body || t("followup.preview.fallback")}
        contactName={`${staffName.split(" ")[0] ?? staffName} · ${template?.brand ?? "Lancôme"}`}
        contactInitials={(staffName[0] ?? "B").toUpperCase()}
      />

      <Modal
        open={phase === "pending-confirm" || phase === "logging"}
        onClose={onConfirmCancelled}
        title={`¿Enviaste el mensaje a ${client.name.split(" ")[0] ?? client.name}?`}
        description={`Si confirmas, lo registramos en el historial de comunicaciones por ${CHANNEL_LABEL[channel]}.`}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={onConfirmCancelled} disabled={isPending}>
              No, cancelé
            </Button>
            <Button
              variant="primary"
              onClick={onConfirmSent}
              loading={isPending}
              leading={<Icon name="check" />}
            >
              Sí, enviado
            </Button>
          </>
        }
      >
        <p className="m-0 text-[15.5px] leading-snug text-ink/70">
          Tu iPad abrió {CHANNEL_LABEL[channel]} con el mensaje. Una vez que le diste Enviar
          desde ahí, confirma aquí para que quede registrado.
        </p>
      </Modal>
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

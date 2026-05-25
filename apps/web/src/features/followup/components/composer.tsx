"use client";

import { useMemo, useState, useTransition } from "react";
import { useT } from "@/lib/i18n/use-t";
import type { BrandId } from "@/types/brand";
import type { Channel } from "@/types/communication";
import type { Client } from "@/types/client";
import type { FollowupCategory, FollowupTask } from "@/types/followup-task";
import type { Template, TemplateCategory } from "@/types/template";
import { Avatar, type AvatarTone, Button, Icon } from "@/components/primitives";
import type { IconName } from "@/types/icon";
import { Card } from "@/components/patterns";
import { Modal } from "@/components/feedback";
import { renderTemplate, type TemplateContext } from "@/features/communications";
import { sendCommunication } from "@/features/communications";
import { completeFollowupTask } from "@/features/clients/actions/complete-followup-task";
import { buildMessageUrl } from "@/lib/messaging/build-message-url";
import { MessagePreview } from "./message-preview";
import { TemplateList } from "./template-list";

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

/**
 * Mapeo de FollowupCategory → TemplateCategory para preseleccionar la
 * plantilla más relevante cuando el composer abre como respuesta a una
 * tarea. Cubre los casos comunes; "3-month-check" usa Post-visita
 * (check-in suave), "6-month-check" usa Reposición (asume hora de
 * reposición), "special-event" usa Lanzamiento. "general" no mapea —
 * deja la selección al BA.
 */
const CATEGORY_TO_TEMPLATE: Partial<Record<FollowupCategory, TemplateCategory>> = {
  "sample-feedback": "Muestra",
  "post-purchase": "Seguimiento",
  birthday: "Cumpleaños",
  replenishment: "Reposición",
  "3-month-check": "Seguimiento",
  "6-month-check": "Reposición",
  "special-event": "Promoción",
};

function pickTemplateForTask(
  templates: readonly Template[],
  task: FollowupTask | null,
): Template | null {
  if (!task) return templates[0] ?? null;
  const targetCategory = CATEGORY_TO_TEMPLATE[task.category];
  if (!targetCategory) return templates[0] ?? null;
  // Prefiere plantilla que matchee categoría + tipo de la task. Si no,
  // cualquiera de la misma categoría. Si no, fallback al primer template.
  const sameCatSameChannel = templates.find(
    (t) =>
      t.category === targetCategory &&
      (task.type === "whatsapp"
        ? t.channel === "WhatsApp"
        : task.type === "email"
          ? t.channel === "Email"
          : true),
  );
  if (sameCatSameChannel) return sameCatSameChannel;
  const sameCat = templates.find((t) => t.category === targetCategory);
  return sameCat ?? templates[0] ?? null;
}

export interface ComposerProps {
  client: Client;
  templates: readonly Template[];
  staffName: string;
  storeName: string;
  /**
   * Tarea de seguimiento que originó este composer (deep link desde el
   * inbox). Cuando viene presente:
   *  - Pre-selecciona la plantilla más relevante por categoría.
   *  - Al confirmar envío exitoso, marca la task como done con el body
   *    del mensaje como result.
   */
  task?: FollowupTask | null;
  /**
   * Contexto enriquecido resuelto en el server para la task o el evento
   * (último producto comprado / muestra dada, fecha relativa, años de
   * aniversario). Se merge con nombre/tienda/ba al renderear la plantilla.
   * Si falta, los tokens dot-notation se dejan literales en el body —
   * la BA edita antes de enviar. Opción A acordada con el cliente.
   */
  taskContext?: TemplateContext;
  /**
   * Categoría de plantilla a pre-seleccionar cuando no hay task — caso de
   * uso: deep link desde un evento (cumpleaños/aniversario) en la
   * pantalla Hoy. Si no hay match en el scope de plantillas (cliente sin
   * Aniversario para su marca, p.ej.), el composer arranca en blanco.
   */
  initialCategory?: TemplateCategory;
  /**
   * "full" (default) — 3 columnas: template list + composer + WhatsApp
   *   preview. Para /ba/followup donde hay espacio horizontal.
   * "compact" — 2 columnas: template list (más angosta) + composer, sin
   *   preview de WhatsApp. Para modal del perfil donde el ancho es menor.
   */
  layout?: "full" | "compact";
  /**
   * Callback opcional disparado cuando el envío fue exitoso y la
   * Communication ya quedó registrada. Lo usa el modal del perfil para
   * auto-cerrarse tras el notice verde.
   */
  onSent?: () => void;
}

type BrandTab = "all" | BrandId;
type SendPhase = "idle" | "pending-confirm" | "logging" | "sent";

/**
 * Si la task viene con un type de canal directo (whatsapp/email),
 * forzamos el canal del composer y filtramos plantillas a ese canal.
 * Sample-feedback se asume WhatsApp (es el canal real en piso).
 * Call/appointment/other dejan canal libre — la BA decide.
 */
function lockedChannelForTask(task: FollowupTask | null | undefined): Channel | null {
  if (!task) return null;
  if (task.type === "whatsapp") return "WhatsApp";
  if (task.type === "email") return "Email";
  if (task.type === "sample-feedback") return "WhatsApp";
  return null;
}

export function Composer({
  client,
  templates,
  staffName,
  storeName,
  task,
  taskContext,
  initialCategory,
  layout = "full",
  onSent,
}: ComposerProps) {
  const t = useT();
  const [brandFilter, setBrandFilter] = useState<BrandTab>("all");

  const lockedChannel = lockedChannelForTask(task ?? null);
  // Si la task fija el canal, filtramos las plantillas a ese canal antes
  // de pasarlas a TemplateList y al picker inicial. Si no, se pasan todas.
  const channelScopedTemplates = useMemo(
    () => (lockedChannel ? templates.filter((t) => t.channel === lockedChannel) : templates),
    [templates, lockedChannel],
  );

  const initialTemplate = useMemo(() => {
    if (task) return pickTemplateForTask(channelScopedTemplates, task);
    if (initialCategory) {
      // Buscamos la plantilla de la categoría pedida, preferentemente
      // de la marca primaria del cliente.
      const clientBrand = client.brands[0];
      const sameCatSameBrand = channelScopedTemplates.find(
        (tpl) => tpl.category === initialCategory && tpl.brand === clientBrand,
      );
      if (sameCatSameBrand) return sameCatSameBrand;
      const sameCat = channelScopedTemplates.find((tpl) => tpl.category === initialCategory);
      return sameCat ?? null;
    }
    return null;
  }, [channelScopedTemplates, task, initialCategory, client.brands]);
  // Sin task ni initialCategory: arranca en "mensaje en blanco". Con
  // cualquiera de los dos: pre-selecciona plantilla.
  const hasPreselect = task != null || initialCategory != null;
  const [template, setTemplate] = useState<Template | null>(initialTemplate);
  const [isBlank, setIsBlank] = useState<boolean>(!hasPreselect || initialTemplate == null);
  const [channel, setChannel] = useState<Channel>(
    lockedChannel ?? initialTemplate?.channel ?? "WhatsApp",
  );
  const [bodyDraft, setBodyDraft] = useState<string | null>(null);
  // El textarea siempre acepta input — la BA puede afinar el mensaje sin
  // tener que pasar por un toggle "Editar". Decisión de UX: la plantilla
  // sirve como punto de partida, no como sello inmutable.
  const [phase, setPhase] = useState<SendPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const renderedBody = useMemo(() => {
    if (!template || isBlank) return "";
    // Merge: contexto de la task (si vino) + contexto base. Los keys del
    // task context tienen precedencia porque son los específicos
    // (muestra.producto, compra.dia, etc.); los base solo agregan
    // nombre/tienda/ba/producto-placeholder que las plantillas siguen
    // usando.
    return renderTemplate(template, {
      nombre: client.name.split(" ")[0] ?? client.name,
      tienda: storeName,
      ba: staffName.split(" ")[0] ?? staffName,
      producto: PRODUCT_PLACEHOLDER,
      ...(taskContext ?? {}),
    });
  }, [template, isBlank, client, storeName, staffName, taskContext]);

  const body = bodyDraft ?? renderedBody;
  const tone: AvatarTone = brandToTone(client.brands[0]);

  function onSelectTemplate(tpl: Template) {
    setTemplate(tpl);
    setIsBlank(false);
    setChannel(tpl.channel);
    setBodyDraft(null);
    setPhase("idle");
    setError(null);
  }

  function onSelectBlank() {
    setIsBlank(true);
    setTemplate(null);
    // En blanco respetamos el canal fijado por la task si existe; si no,
    // default WhatsApp y la BA puede cambiarlo.
    if (!lockedChannel) setChannel("WhatsApp");
    setBodyDraft("");
    setPhase("idle");
    setError(null);
  }

  function onOpenExternal() {
    if (!isBlank && !template) return;
    if (!body.trim()) {
      setError("El mensaje no puede estar vacío.");
      return;
    }
    setError(null);
    const subject = template
      ? `${template.category} · ${template.brand}`
      : `Mensaje · ${client.brands[0] ?? "Lancôme"}`;
    const url = buildMessageUrl({
      channel,
      phone: client.phone,
      email: client.email,
      body,
      subject,
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
    if (!isBlank && !template) return;
    setError(null);
    setPhase("logging");
    // En modo blank no hay templateId. La marca del registro es la
    // primera del cliente (los clientes en este BA siempre tienen al
    // menos una marca por la validación de creación).
    const brandForLog = template?.brand ?? client.brands[0];
    if (!brandForLog) {
      setError("El cliente no tiene marca asignada para registrar el mensaje.");
      setPhase("pending-confirm");
      return;
    }
    startTransition(async () => {
      const result = await sendCommunication({
        clientId: client.id,
        channel,
        body,
        brand: brandForLog,
        ...(template ? { templateId: template.id } : {}),
      });
      if (!result.ok) {
        setError(result.message ?? t("followup.error.send"));
        setPhase("pending-confirm");
        return;
      }
      // Si este composer abrió respondiendo a una task pendiente,
      // ciérrala automáticamente con el body como result. La BA no debe
      // tener que marcar manualmente "hecha" después de mandar el mensaje
      // — el envío ES la ejecución de la task.
      if (task && task.status === "pending") {
        const summary = `Mensaje ${CHANNEL_LABEL[channel]} enviado: "${
          body.length > 140 ? body.slice(0, 137) + "…" : body
        }"`;
        await completeFollowupTask({ taskId: task.id, result: summary });
      }
      setPhase("sent");
      // Auto-cierre del modal del perfil cuando el padre lo pide. Damos
      // 1.5s para que la BA vea el notice verde antes de cerrar.
      if (onSent) {
        setTimeout(() => onSent(), 1500);
      }
    });
  }

  function onConfirmCancelled() {
    setPhase("idle");
  }

  function onComposeAgain() {
    setPhase("idle");
    setBodyDraft(null);
  }

  // Cuando no hay task ni intent de evento, "Nuevo mensaje" es mensaje
  // libre puro: ocultamos la lista de plantillas y el grid colapsa a
  // composer + preview. Acuerdo con el cliente: las plantillas son para
  // responder tareas o eventos (cumple/aniversario); mensajes ad-hoc
  // son blank por default.
  const showTemplates = hasPreselect;
  const gridClass = showTemplates
    ? layout === "compact"
      ? "grid grid-cols-1 md:grid-cols-[260px_minmax(0,1fr)] gap-4 items-start"
      : "grid grid-cols-[320px_minmax(0,1fr)_300px] gap-5 items-start"
    : layout === "compact"
      ? "grid grid-cols-1 gap-4 items-start"
      : "grid grid-cols-[minmax(0,1fr)_300px] gap-5 items-start";

  return (
    <div className={gridClass}>
      {showTemplates ? (
        <TemplateList
          templates={channelScopedTemplates}
          selectedId={template?.id ?? null}
          onSelect={onSelectTemplate}
          brand={brandFilter}
          onBrandChange={setBrandFilter}
          blankSelected={isBlank}
          onSelectBlank={onSelectBlank}
        />
      ) : null}

      <Card variant="luxe" className="flex flex-col gap-4">
        <header>
          <span className="text-[15px] font-semibold tracking-[0.12em] uppercase text-ink/60">
            {t("followup.composer")}
          </span>
          <h2 className="m-0 font-display text-[28px] leading-tight tracking-[-0.005em]">
            {template
              ? `${template.category} · ${template.brand}`
              : isBlank
                ? `Mensaje en blanco · ${client.brands[0] ?? ""}`
                : t("followup.no_template")}
          </h2>
        </header>

        {task && task.status === "pending" ? (
          <Card
            variant="flat"
            className="bg-ink/[0.04] border-ink/15 flex items-start gap-3"
          >
            <span
              aria-hidden
              className="inline-flex w-9 h-9 items-center justify-center rounded-md bg-white text-ink shrink-0"
            >
              <Icon name="check" size={16} />
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-semibold tracking-[0.08em] uppercase text-ink/55">
                Respondiendo a una tarea
              </div>
              <p className="m-0 mt-0.5 text-[15px] leading-snug">
                <strong className="text-ink">{task.description}</strong>
              </p>
              <p className="m-0 mt-1 text-[13.5px] text-ink/55">
                Al confirmar envío, esta tarea se marcará como hecha automáticamente.
              </p>
            </div>
          </Card>
        ) : null}

        <Card variant="flat" className="flex items-center gap-3 bg-bone border-transparent">
          <Avatar initials={initials(client.name)} tone={tone} size={40} />
          <div className="flex-1 min-w-0">
            <div className="text-[16px] font-semibold leading-tight truncate">{client.name}</div>
            <div className="text-[15px] font-medium leading-snug text-ink/60 truncate">
              {client.phone} · {client.email}
            </div>
          </div>
        </Card>

        {lockedChannel ? (
          <div>
            <span className="block text-[15px] font-semibold tracking-[0.12em] uppercase text-ink/60 mb-2">
              {t("followup.channel")}
            </span>
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-bone border border-line text-[14px] font-semibold">
              <Icon name={CHANNEL_ICON[lockedChannel]} size={14} />
              {lockedChannel}
              <span className="text-[12.5px] font-normal text-ink/55 ml-1">
                · canal fijado por la tarea
              </span>
            </div>
          </div>
        ) : (
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
        )}

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[15px] font-semibold tracking-[0.12em] uppercase text-ink/60">
              {t("followup.body")}
            </span>
            {phase === "idle" && template && !isBlank && bodyDraft !== null ? (
              <button
                type="button"
                onClick={() => setBodyDraft(null)}
                className="text-[14px] font-medium text-ink/60 hover:text-ink underline-offset-2 hover:underline bg-transparent border-0 p-0 cursor-pointer"
              >
                Restaurar plantilla
              </button>
            ) : null}
          </div>
          <textarea
            value={body}
            readOnly={phase !== "idle"}
            onChange={(e) => setBodyDraft(e.target.value)}
            placeholder={isBlank ? "Escribe tu mensaje aquí…" : undefined}
            className="w-full h-[140px] p-3.5 text-[17px] leading-snug rounded-[10px] border border-line bg-white resize-none focus-visible:border-ink outline-none"
          />
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
          <div className="inline-flex items-center gap-2 px-4 py-3 bg-ok/[0.1] text-ok rounded-md text-[15.5px] font-semibold leading-snug border border-ok/25 self-start">
            <Icon name="check" />
            <span>
              Mensaje registrado en el historial de {client.name.split(" ")[0]}.
              {task && task.status === "pending" ? " Tarea marcada como hecha." : ""}
            </span>
          </div>
        ) : null}

        <footer className="flex justify-end gap-3 items-center">
          {phase === "sent" ? (
            <Button variant="ghost" onClick={onComposeAgain}>
              Componer otro mensaje
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={onOpenExternal}
              disabled={(!template && !isBlank) || phase !== "idle"}
              leading={<Icon name={CHANNEL_ICON[channel]} size={14} />}
              trailing={<Icon name="arrow-right" />}
            >
              Abrir en {CHANNEL_LABEL[channel]}
            </Button>
          )}
        </footer>
      </Card>

      {layout === "full" ? (
        <MessagePreview
          channel={channel}
          body={body || t("followup.preview.fallback")}
          subject={
            template
              ? `${template.category} · ${template.brand}`
              : `Mensaje · ${client.brands[0] ?? "Lancôme"}`
          }
          contactName={client.name}
          contactInitials={(client.name[0] ?? "C").toUpperCase()}
          contactPhone={client.phone}
          contactEmail={client.email}
          fromName={staffName.split(" ")[0] ?? staffName}
          fromBrand={template?.brand ?? client.brands[0] ?? "Lancôme"}
        />
      ) : null}

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

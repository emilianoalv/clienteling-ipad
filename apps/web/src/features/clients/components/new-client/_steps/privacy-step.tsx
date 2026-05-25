"use client";

import { Icon, Toggle } from "@/components/primitives";
import { SignaturePad } from "@/components/feedback";
import { CHANNELS } from "../../../schemas/new-client.schema";
import { PrivacyNotice } from "../_parts/privacy-notice";
import { StepHeader } from "../_parts/step-header";
import type { Draft, FieldErrors } from "../types";

const CHANNEL_ICONS = {
  SMS: "sms",
  Email: "email",
  WhatsApp: "whatsapp",
} as const;

export const PRIVACY_NOTICE_VERSION = "v2026.05";

export interface PrivacyStepProps {
  draft: Draft;
  errors: FieldErrors;
  update<K extends keyof Draft>(key: K, value: Draft[K]): void;
  storeName: string;
  baName: string;
}

export function PrivacyStep({ draft, errors, update, storeName, baName }: PrivacyStepProps) {
  const activeChannels = CHANNELS.filter((c) => draft.channels[c]);

  return (
    <>
      <StepHeader
        eyebrow="PASO 3 · AVISO DE PRIVACIDAD"
        title="Consentimiento y aviso"
        subtitle={`Versión vigente · ${PRIVACY_NOTICE_VERSION} · El cliente puede revocar cualquier canal en cualquier momento.`}
      />

      <PrivacyNotice version={PRIVACY_NOTICE_VERSION} />

      <div className="mt-4 text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60 mb-2">
        Canales de comunicación autorizados
      </div>

      <ul className="list-none m-0 p-0">
        {CHANNELS.map((ch) => (
          <li
            key={ch}
            className="flex items-center gap-3.5 py-3.5 border-b border-line last:border-b-0"
          >
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-[10px] bg-bone text-ink">
              <Icon name={CHANNEL_ICONS[ch]} size={18} />
            </span>
            <div className="flex-1">
              <div className="text-sm font-semibold">{ch}</div>
              <div className="text-xs text-ink/60">Comunicaciones comerciales por {ch}</div>
            </div>
            <Toggle
              checked={draft.channels[ch]}
              onChange={(next) =>
                update("channels", { ...draft.channels, [ch]: next })
              }
              ariaLabel={`Autorizar ${ch}`}
            />
          </li>
        ))}
      </ul>

      <label
        className={`mt-4 flex items-start gap-3 p-3.5 rounded-[10px] border cursor-pointer transition-colors ${
          draft.acceptPrivacy ? "bg-ok/[0.08] border-ok/30" : "bg-bone border-line"
        }`}
      >
        <input
          type="checkbox"
          checked={draft.acceptPrivacy}
          onChange={(e) => {
            update("acceptPrivacy", e.target.checked);
            // Si la BA desmarca el accept, también borramos la firma —
            // no tiene sentido conservarla sin consentimiento.
            if (!e.target.checked && draft.signature) update("signature", "");
          }}
          className="mt-0.5 w-[18px] h-[18px] accent-ink"
        />
        <div className="flex-1">
          <div className="text-[16px] font-semibold">He leído y acepto el aviso de privacidad *</div>
          <div className="text-[15.5px] text-ink/60 mt-1">
            Confirmo que el cliente ha sido informado y otorga su consentimiento expreso para el
            tratamiento de sus datos personales bajo el aviso versión{" "}
            <strong>{PRIVACY_NOTICE_VERSION}</strong>.
          </div>
        </div>
      </label>
      {errors.acceptPrivacy?.[0] ? (
        <span className="block mt-1.5 text-xs text-err">{errors.acceptPrivacy[0]}</span>
      ) : null}

      {draft.acceptPrivacy ? (
        <div className="mt-4">
          <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60 mb-2">
            Firma del cliente *
          </div>
          <p className="m-0 mb-2 text-[14px] text-ink/55 leading-snug">
            Pasa el iPad al cliente para que firme con el dedo o Apple Pencil. La firma se guarda
            junto al registro de consentimiento como evidencia LFPDPPP.
          </p>
          <SignaturePad
            ariaLabel="Firma del cliente sobre el aviso de privacidad"
            onChange={(value) => update("signature", value ?? "")}
          />
          {errors.signature?.[0] ? (
            <span className="block mt-1.5 text-xs text-err">{errors.signature[0]}</span>
          ) : null}
        </div>
      ) : null}

      <div className="mt-5 p-4 bg-bone rounded-xl">
        <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
          Registro legal (automático al guardar)
        </div>
        <div className="text-xs mt-1.5 leading-relaxed">
          Marca temporal UTC · IP del dispositivo · versión del aviso{" "}
          <strong>{PRIVACY_NOTICE_VERSION}</strong> · ubicación <strong>{storeName}</strong> · BA{" "}
          <strong>{baName}</strong>.
        </div>
      </div>

      <div className="mt-5 p-4 bg-bone rounded-xl">
        <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
          Resumen para guardar
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 mt-2 text-xs">
          <Summary label="Nombre" value={`${draft.firstName || "—"} ${draft.lastName}`.trim()} />
          <Summary label="Teléfono" value={draft.phone ? `${draft.dialCode} ${draft.phone}` : "—"} />
          <Summary label="Marca" value={draft.brands.join(" · ") || "—"} />
          <Summary label="Piel" value={draft.skin.type} />
          <Summary label="Preocupaciones" value={String(draft.skin.concerns.length)} />
          <Summary
            label="Canales activos"
            value={activeChannels.length ? activeChannels.join(" · ") : "Ninguno"}
          />
        </div>
      </div>
    </>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-[15px] text-ink/60">{label}</span>
      <div className="font-semibold text-[16.5px]">{value}</div>
    </div>
  );
}

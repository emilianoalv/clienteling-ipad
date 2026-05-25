"use client";

import { Icon } from "@/components/primitives";

export interface EmailPreviewProps {
  body: string;
  subject: string;
  fromName: string;
  fromBrand: string;
  toEmail: string;
}

const PHONE_W = 280;
const PHONE_H = 520;
const HEADER_BG = "#1B1B1B";

/**
 * Mock visual de cómo se vería el mensaje al abrirse en la app de mail
 * del iPad (estilo Mail.app de iOS). El composer la muestra cuando el
 * canal activo es Email.
 *
 * No es funcional — la BA sigue mandando vía mailto: y este preview
 * solo le ayuda a anticipar cómo va a llegar.
 */
export function EmailPreview({
  body,
  subject,
  fromName,
  fromBrand,
  toEmail,
}: EmailPreviewProps) {
  return (
    <div className="flex flex-col items-center">
      <div
        className="rounded-[36px] bg-[#0a0a0a] p-2.5 shadow-lift-lg"
        style={{ width: PHONE_W, height: PHONE_H }}
        aria-hidden
      >
        <div
          className="w-full h-full overflow-hidden flex flex-col rounded-[28px]"
          style={{ background: "#FFFFFF" }}
        >
          <div
            className="px-3.5 pt-8 pb-2.5 flex items-center gap-2.5 text-white"
            style={{ background: HEADER_BG }}
          >
            <Icon name="arrow-left" size={16} />
            <div className="flex-1 leading-tight text-center">
              <div className="text-[15px] font-semibold">Borrador</div>
              <div className="text-[13px] opacity-70">Nuevo mensaje</div>
            </div>
            <Icon name="arrow-right" size={16} />
          </div>
          <div className="px-3.5 py-2.5 border-b border-line text-[13.5px]">
            <div className="flex gap-1.5 text-ink/60">
              <span className="font-semibold">De:</span>
              <span className="text-ink truncate">
                {fromName} · {fromBrand}
              </span>
            </div>
            <div className="flex gap-1.5 text-ink/60 mt-1">
              <span className="font-semibold">Para:</span>
              <span className="text-ink truncate">{toEmail}</span>
            </div>
            <div className="flex gap-1.5 text-ink/60 mt-1">
              <span className="font-semibold">Asunto:</span>
              <span className="text-ink truncate">{subject}</span>
            </div>
          </div>
          <div className="flex-1 p-3.5 text-[14.5px] leading-snug text-ink overflow-hidden whitespace-pre-wrap">
            {body}
          </div>
        </div>
      </div>
      <p className="m-0 mt-3 text-[15px] font-medium text-ink/60">Vista previa en Mail</p>
    </div>
  );
}

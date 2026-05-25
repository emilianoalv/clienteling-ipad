"use client";

import { Icon } from "@/components/primitives";

export interface SmsPreviewProps {
  body: string;
  contactName: string;
  contactPhone: string;
}

const PHONE_W = 280;
const PHONE_H = 520;
const SMS_BUBBLE = "#34C759"; // verde SMS de iOS Messages
const CANVAS_BG = "#FFFFFF";

/**
 * Mock visual del mensaje en la app de Mensajes de iOS (burbuja verde
 * porque es SMS, no iMessage). El composer la usa cuando el canal
 * activo es SMS.
 */
export function SmsPreview({ body, contactName, contactPhone }: SmsPreviewProps) {
  return (
    <div className="flex flex-col items-center">
      <div
        className="rounded-[36px] bg-[#0a0a0a] p-2.5 shadow-lift-lg"
        style={{ width: PHONE_W, height: PHONE_H }}
        aria-hidden
      >
        <div
          className="w-full h-full overflow-hidden flex flex-col rounded-[28px]"
          style={{ background: CANVAS_BG }}
        >
          <div className="px-3.5 pt-8 pb-3 flex flex-col items-center gap-1 border-b border-line">
            <Icon name="arrow-left" size={16} />
            <div className="text-[15px] font-semibold text-ink">{contactName}</div>
            <div className="text-[12.5px] text-ink/55">{contactPhone}</div>
          </div>
          <div className="flex-1 p-3.5 flex flex-col gap-2 justify-end overflow-hidden">
            <div
              className="self-end px-3 py-2 rounded-[18px] max-w-[80%] text-[14.5px] leading-snug text-white"
              style={{ background: SMS_BUBBLE }}
            >
              {body}
            </div>
            <div className="self-end text-[11.5px] text-ink/45 mt-0.5">Entregado</div>
          </div>
        </div>
      </div>
      <p className="m-0 mt-3 text-[15px] font-medium text-ink/60">Vista previa en Mensajes</p>
    </div>
  );
}

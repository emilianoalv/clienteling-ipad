"use client";

import { useT } from "@/lib/i18n/use-t";
import { Icon } from "@/components/primitives";

export interface WhatsappPreviewProps {
  body: string;
  contactName: string;
  contactInitials: string;
}

const PHONE_W = 280;
const PHONE_H = 520;
const HEADER_BG = "#075E54";
const CANVAS_BG = "#E5DED1";

export function WhatsappPreview({ body, contactName, contactInitials }: WhatsappPreviewProps) {
  const t = useT();
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
          <div
            className="px-3.5 pt-8 pb-2.5 flex items-center gap-2.5 text-white"
            style={{ background: HEADER_BG }}
          >
            <Icon name="arrow-left" size={16} />
            <span className="inline-flex w-8 h-8 items-center justify-center rounded-full bg-white/20 text-[16px] font-semibold">
              {contactInitials}
            </span>
            <div className="leading-tight">
              <div className="text-[16px] font-semibold">{contactName}</div>
              <div className="text-[14px] opacity-80">{t("followup.preview.online")}</div>
            </div>
          </div>
          <div className="flex-1 p-3.5 flex flex-col gap-2 overflow-hidden">
            <div className="self-start bg-white px-3 py-2 rounded-[10px] max-w-[85%] text-[16px] leading-snug text-ink">
              {body}
              <div className="text-[13px] text-ink/40 text-right mt-1">14:32 ✓✓</div>
            </div>
          </div>
        </div>
      </div>
      <p className="m-0 mt-3 text-[15px] font-medium text-ink/60">
        {t("followup.preview.caption")}
      </p>
    </div>
  );
}

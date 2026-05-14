"use client";

import { useTranslations } from "next-intl";
import type { Purchase } from "@/types/purchase";
import { Icon } from "@/components/primitives";
import { formatCurrency } from "@/lib/format/format-currency";
import { formatDate } from "@/lib/format/format-date";

export interface PurchasesPreviewProps {
  purchases: readonly Purchase[];
}

export function PurchasesPreview({ purchases }: PurchasesPreviewProps) {
  const t = useTranslations();
  if (purchases.length === 0) {
    return (
      <p className="m-0 text-[16px] font-medium leading-normal text-ink/60">
        {t("profile.empty.purchases")}
      </p>
    );
  }

  return (
    <ul className="list-none m-0 p-0 flex flex-col">
      {purchases.slice(0, 4).map((p) => (
        <li
          key={p.id}
          className="grid grid-cols-[36px_1fr_auto_auto] items-center gap-3 py-3 border-b border-dashed border-line last:border-b-0"
        >
          <span
            aria-hidden
            className="inline-flex w-9 h-9 items-center justify-center rounded-full bg-bone text-ink/60"
          >
            <Icon name="bag" />
          </span>
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[16px] font-semibold leading-snug text-ink">
              {p.items.length} {p.items.length === 1 ? "producto" : "productos"} ·{" "}
              {t(`sale.payment.${p.payment}`)}
            </span>
            {p.ticketRef ? (
              <span className="text-xs font-medium leading-snug text-ink/60">Ticket {p.ticketRef}</span>
            ) : null}
          </div>
          <span className="text-xs font-medium leading-none text-ink/60">{formatDate(p.at)}</span>
          <span className="text-[16px] font-semibold leading-none tabular">
            {formatCurrency(p.total)}
          </span>
        </li>
      ))}
    </ul>
  );
}

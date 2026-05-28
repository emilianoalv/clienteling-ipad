"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Avatar, BrandTag, Chip, Icon, Input } from "@/components/primitives";
import { Card, EmptyState } from "@/components/patterns";
import { formatCurrency } from "@/lib/format/format-currency";
import type { Product, Sku } from "@/types/product";
import type { Purchase } from "@/types/purchase";

export interface PurchasesListProps {
  purchases: readonly Purchase[];
  clientLookup: Readonly<Record<string, string>>;
  productLookup: Readonly<Record<Sku, Pick<Product, "line">>>;
}

export function PurchasesList({ purchases, clientLookup, productLookup }: PurchasesListProps) {
  const t = useTranslations();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return purchases;
    return purchases.filter((p) => {
      const clientName = clientLookup[p.clientId] ?? "";
      return `${clientName} ${p.ticketRef ?? ""} ${p.id}`.toLowerCase().includes(q);
    });
  }, [purchases, query, clientLookup]);

  const totalRev = filtered.reduce((s, p) => s + (p.total || 0), 0);

  return (
    <div className="flex flex-col gap-4">
      <Card variant="flat" className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[260px]">
          <Input
            aria-label={t("purchases.search")}
            placeholder={t("purchases.search")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40">
            <Icon name="search" size={16} />
          </span>
        </div>
        <Chip>
          {t("purchases.count", { count: filtered.length })} · {formatCurrency(totalRev)}
        </Chip>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState title={t("purchases.empty.title")} description={t("purchases.empty.description")} />
      ) : (
        <Card variant="flat" className="p-0 overflow-hidden">
          <div className="grid grid-cols-[0.9fr_1.4fr_1.6fr_1fr_0.7fr_0.8fr] gap-3 px-5 py-3 bg-bone border-b border-line text-[14px] font-semibold tracking-[0.12em] uppercase text-ink/60">
            <span>{t("purchases.column.ticket")}</span>
            <span>{t("purchases.column.client")}</span>
            <span>{t("purchases.column.products")}</span>
            <span>{t("purchases.column.date")}</span>
            <span>{t("purchases.column.brand")}</span>
            <span>{t("purchases.column.total")}</span>
          </div>
          <ul className="list-none m-0 p-0">
            {filtered.map((p) => {
              const clientName = clientLookup[p.clientId] ?? t("purchases.unknown_client");
              const productLines = p.items
                .map((it) => productLookup[it.sku]?.line ?? it.sku)
                .filter(Boolean)
                .join(" · ");
              const ticket = p.ticketRef ?? `#${p.id.replace(/^pu-/, "")}`;
              return (
                <li key={p.id}>
                  <Link
                    href={`/ba/clients/${p.clientId}/purchases/${p.id}`}
                    className="grid grid-cols-[0.9fr_1.4fr_1.6fr_1fr_0.7fr_0.8fr] gap-3 px-5 py-3.5 border-b border-line last:border-b-0 items-center cursor-pointer no-underline text-inherit hover:bg-bone transition-colors"
                  >
                    <span className="inline-flex items-center gap-1.5 min-w-0">
                      <span className="font-mono text-[16px] font-semibold">{ticket}</span>
                      {p.manual ? (
                        <Chip size="sm" className="h-4 text-[13px]">
                          {t("purchases.manual")}
                        </Chip>
                      ) : null}
                    </span>
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar initials={initials(clientName)} size={28} />
                      <span className="text-[16px] font-medium leading-tight truncate">
                        {clientName}
                      </span>
                    </div>
                    <span
                      className="text-[15px] font-medium leading-snug text-ink/60 truncate"
                      title={productLines}
                    >
                      {productLines}
                    </span>
                    <span className="text-[16px] font-medium tabular">
                      {formatDate(p.at)}
                      <span className="text-ink/60"> · {formatTime(p.at)}</span>
                    </span>
                    <span>{p.brand ? <BrandTag brand={p.brand} alwaysShow /> : <span className="text-ink/40">—</span>}</span>
                    <span className="text-[16px] font-semibold tabular">
                      {formatCurrency(p.total)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
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

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short" }).format(
      new Date(iso),
    );
  } catch {
    return iso;
  }
}

function formatTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("es-MX", { hour: "2-digit", minute: "2-digit" }).format(
      new Date(iso),
    );
  } catch {
    return iso;
  }
}

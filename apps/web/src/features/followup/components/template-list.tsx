"use client";

import { useMemo } from "react";
import { useT } from "@/lib/i18n/use-t";
import type { BrandId } from "@/types/brand";
import type { Template } from "@/types/template";
import { BrandTag } from "@/components/primitives";
import { Card } from "@/components/patterns";

type BrandTab = "all" | BrandId;

export interface TemplateListProps {
  templates: readonly Template[];
  selectedId: string | null;
  onSelect(template: Template): void;
  brand: BrandTab;
  onBrandChange(b: BrandTab): void;
}

export function TemplateList({
  templates,
  selectedId,
  onSelect,
  brand,
  onBrandChange,
}: TemplateListProps) {
  const t = useT();

  // Derive brand tabs from the templates we actually received. For un BA
  // single-brand (Valentina · Lancôme), el server ya filtró las
  // templates a su marca, así que el selector solo mostraría "Todas ·
  // Lancôme" — redundante. Lo ocultamos si solo hay una marca presente.
  const brandTabs = useMemo<readonly BrandTab[]>(() => {
    const present = new Set<BrandId>();
    for (const tpl of templates) present.add(tpl.brand);
    const ordered: BrandId[] = [];
    for (const b of ["Lancôme", "YSL"] as const) {
      if (present.has(b)) ordered.push(b);
    }
    return ["all", ...ordered];
  }, [templates]);
  const showBrandPicker = brandTabs.length > 2;

  const filtered = templates.filter((tpl) => brand === "all" || tpl.brand === brand);

  return (
    <Card className="self-start flex flex-col gap-3">
      <span className="text-[15px] font-semibold tracking-[0.12em] uppercase text-ink/60">
        {t("followup.templates")}
      </span>
      {showBrandPicker ? (
        <div className="inline-flex bg-bone rounded-pill p-[3px] border border-line w-fit">
          {brandTabs.map((b) => {
            const active = brand === b;
            return (
              <button
                key={b}
                type="button"
                onClick={() => onBrandChange(b)}
                aria-pressed={active}
                className={`h-7 px-3 rounded-pill border-0 text-[15px] font-semibold cursor-pointer transition-colors ${
                  active
                    ? "bg-white text-ink shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
                    : "bg-transparent text-ink/60"
                }`}
              >
                {b === "all" ? t("followup.brand_all") : b}
              </button>
            );
          })}
        </div>
      ) : null}
      <ul className="list-none m-0 p-0 flex flex-col gap-2">
        {filtered.map((tpl) => {
          const active = selectedId === tpl.id;
          return (
            <li key={tpl.id}>
              <button
                type="button"
                onClick={() => onSelect(tpl)}
                aria-pressed={active}
                className={`block w-full text-left p-3 rounded-md cursor-pointer transition-colors ${
                  active ? "bg-bone border border-ink" : "bg-white border border-line hover:border-ink/30"
                }`}
              >
                {showBrandPicker ? (
                  <div className="mb-1">
                    <BrandTag brand={tpl.brand} alwaysShow />
                  </div>
                ) : null}
                <div className="text-[16px] font-semibold leading-tight">{tpl.category}</div>
                <div className="text-[15px] font-medium leading-snug text-ink/60 mt-1 line-clamp-2">
                  {tpl.body.slice(0, 80)}…
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

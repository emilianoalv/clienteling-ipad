"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { Sample } from "@/types/sample";
import { BrandTag, Chip, Icon } from "@/components/primitives";
import { formatDate } from "@/lib/format/format-date";

export interface SamplesPreviewProps {
  samples: readonly Sample[];
  clientId: string;
  /** Prefijo de ruta para deep-links. Default `/ba/clients`. */
  basePath?: string;
}

/**
 * Tab "Muestras" del perfil del cliente — lista completa, agrupada por
 * sesión (día). Una visita puede dejar 2-3 muestras y agruparlas hace
 * obvio cuáles vinieron juntas. Cada fila es clickable al detail.
 *
 * El botón "Ver con filtros" lleva a `/ba/clients/[id]/samples`, que
 * agrega KPIs (% conversión, días promedio) y filtros por periodo /
 * estado — útiles para análisis profundo pero ruidosos para el tab.
 */
export function SamplesPreview({
  samples,
  clientId,
  basePath = "/ba/clients",
}: SamplesPreviewProps) {
  const t = useTranslations();

  const groups = useMemo(() => groupByDay(samples), [samples]);

  if (samples.length === 0) {
    return (
      <p className="m-0 text-[16px] font-medium leading-normal text-ink/60">
        {t("profile.empty.samples")}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-baseline justify-between gap-3 flex-wrap">
        <div>
          <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
            Historial de muestras
          </div>
          <p className="m-0 mt-1 text-[14.5px] text-ink/60 leading-snug">
            Productos sampleados al cliente — entrega, conversión y seguimiento.
          </p>
        </div>
        <Link
          href={`${basePath}/${clientId}/samples`}
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md border border-line bg-white text-[14px] font-semibold text-ink no-underline transition-colors hover:bg-bone"
        >
          Ver todo
          <Icon name="arrow-right" size={13} />
        </Link>
      </header>

      <div className="flex flex-col gap-4">
        {groups.map((group) => (
          <section
            key={group.day}
            className="border border-line rounded-lg bg-white overflow-hidden"
          >
            <header className="flex items-center justify-between gap-3 px-4 py-2.5 bg-bone/60 border-b border-line">
              <span className="text-[13.5px] font-semibold tracking-[0.06em] uppercase text-ink/70">
                {formatDate(group.day)}
              </span>
              <span className="text-[12.5px] font-medium text-ink/55 tabular">
                {group.samples.length}{" "}
                {group.samples.length === 1 ? "muestra" : "muestras"}
              </span>
            </header>
            <ul className="list-none m-0 p-0 flex flex-col">
              {group.samples.map((s) => (
                <li key={s.id} className="border-b border-line last:border-b-0">
                  <Link
                    href={`${basePath}/${clientId}/samples/${s.id}`}
                    className="grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3.5 py-3 px-4 text-ink no-underline transition-colors hover:bg-bone/40"
                  >
                    <span
                      aria-hidden
                      className="inline-flex w-10 h-10 items-center justify-center rounded-md bg-bone text-ink/60"
                    >
                      <Icon name="gift" size={18} />
                    </span>
                    <div className="min-w-0 flex flex-col gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[15px] font-semibold leading-tight">{s.name}</span>
                        <BrandTag brand={s.brand} alwaysShow />
                      </div>
                      <span className="text-[13.5px] text-ink/60 leading-tight truncate">
                        SKU {s.sku}
                      </span>
                    </div>
                    {s.converted ? (
                      <Chip variant="ok" size="sm">
                        Convertida
                      </Chip>
                    ) : (
                      <Chip variant="warn" size="sm">
                        Pendiente
                      </Chip>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

interface DayGroup {
  /** YYYY-MM-DD — usado como key y para formatear el header. */
  day: string;
  samples: readonly Sample[];
}

/**
 * Agrupa muestras por día de entrega — proxy razonable para "visita".
 * Toma los primeros 10 chars del ISO así no importa la zona horaria de
 * presentación. Orden descendente (más reciente arriba).
 */
function groupByDay(samples: readonly Sample[]): DayGroup[] {
  const byDay = new Map<string, Sample[]>();
  for (const s of samples) {
    const day = s.givenAt.slice(0, 10);
    const bucket = byDay.get(day);
    if (bucket) bucket.push(s);
    else byDay.set(day, [s]);
  }
  return [...byDay.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([day, group]) => ({ day, samples: group }));
}

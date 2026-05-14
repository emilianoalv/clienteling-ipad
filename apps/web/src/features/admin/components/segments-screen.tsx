import type { Client, Segment } from "@/types/client";
import { Avatar } from "@/components/primitives";
import { Card } from "@/components/patterns";
import { formatCurrency } from "@/lib/format/format-currency";
import { groupClientsBySegment } from "../services/group-clients-by-segment";

const SEGMENT_LABEL: Record<Segment, string> = {
  VIP: "VIP",
  Recurrent: "Recurrente",
  New: "Nueva",
  AtRisk: "En riesgo",
};

const SEGMENT_DOT: Record<Segment, string> = {
  VIP: "bg-ysl-gold",
  Recurrent: "bg-ok",
  New: "bg-ink",
  AtRisk: "bg-err",
};

const SEGMENT_RULE: Record<Segment, string> = {
  VIP: "LTV ≥ $150 000 MXN · 6+ visitas",
  Recurrent: "5+ visitas o LTV ≥ $50 000",
  New: "< 5 visitas registradas",
  AtRisk: "Sin compra > 180 días",
};

export interface SegmentsScreenProps {
  clients: readonly Client[];
}

export function SegmentsScreen({ clients }: SegmentsScreenProps) {
  const buckets = groupClientsBySegment(clients);

  return (
    <div className="flex flex-col gap-4">
      <Card variant="luxe">
        <span className="block text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
          Segmentación
        </span>
        <h2 className="m-0 font-display text-[30px] leading-tight">Estados de clienta</h2>
        <p className="m-0 mt-1 text-[16px] max-w-[620px]">
          Reglas aplicadas sobre LTV, visitas y recencia de compra. La etiqueta se recalcula en cada interacción.
        </p>
      </Card>

      <div className="grid grid-cols-4 gap-3.5">
        {buckets.map((b) => (
          <Card key={b.segment}>
            <div className="flex items-center gap-2.5">
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${SEGMENT_DOT[b.segment]}`} />
              <span className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
                {SEGMENT_LABEL[b.segment]}
              </span>
            </div>
            <div className="font-display text-[38px] mt-1.5 leading-none tabular">
              {b.clients.length}
            </div>
            <p className="m-0 mt-1 text-[15px] leading-snug text-ink/60">{SEGMENT_RULE[b.segment]}</p>
            <hr className="my-3 border-0 border-t border-dashed border-line" />
            <ul className="list-none m-0 p-0">
              {b.clients.slice(0, 3).map((c) => (
                <li
                  key={c.id}
                  className="flex items-center gap-2 py-1.5 border-b border-dashed border-line last:border-b-0"
                >
                  <Avatar initials={initials(c.name)} size={28} />
                  <div className="min-w-0">
                    <div className="text-[16px] font-semibold truncate">{c.name}</div>
                    <div className="text-[14px] text-ink/60 tabular">
                      {formatCurrency(c.stats.ltv)} LTV
                    </div>
                  </div>
                </li>
              ))}
              {b.clients.length === 0 ? (
                <li className="text-[15px] text-ink/40 py-2">Sin clientas en este segmento.</li>
              ) : null}
            </ul>
          </Card>
        ))}
      </div>
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

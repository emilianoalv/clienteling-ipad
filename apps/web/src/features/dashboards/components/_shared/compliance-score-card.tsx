import { cn } from "@/lib/cn";
import { formatPercent } from "@/lib/format/number";
import type {
  ComplianceData,
  ComplianceGrade,
} from "../../lib/compliance-score";

export interface ComplianceScoreCardProps {
  data: ComplianceData;
  className?: string;
}

const GRADE_STYLES: Record<
  ComplianceGrade,
  { band: string; tone: string; label: string }
> = {
  excelente: { band: "bg-ok", tone: "text-ok", label: "Excelente" },
  bueno: { band: "bg-ok", tone: "text-ok", label: "Bueno" },
  atencion: { band: "bg-warn", tone: "text-warn", label: "Atención" },
  critico: { band: "bg-err", tone: "text-err", label: "Crítico" },
};

/**
 * LFPDPPP compliance posture card. The visual mirrors the spec §3.4 Sec 5
 * mockup: big score + colored bar + breakdown list with check/warn icons.
 */
export function ComplianceScoreCard({
  data,
  className,
}: ComplianceScoreCardProps) {
  const style = GRADE_STYLES[data.grade];
  return (
    <article
      className={cn(
        "bg-white border border-line rounded-lg p-5 flex flex-col gap-4",
        className,
      )}
    >
      <header className="flex items-baseline justify-between gap-3">
        <div>
          <span className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
            Compliance LFPDPPP
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-display text-[44px] leading-none tabular">
              {data.score}
            </span>
            <span className="text-[18px] text-ink/60">/ 100</span>
          </div>
        </div>
        <span
          className={cn(
            "text-[14px] font-semibold uppercase tracking-[0.06em]",
            style.tone,
          )}
        >
          {style.label}
        </span>
      </header>

      <div className="h-2 rounded-full bg-ink/[0.06] overflow-hidden">
        <div
          className={cn("h-full", style.band)}
          style={{ width: `${Math.max(2, data.score)}%` }}
        />
      </div>

      <ul className="list-none m-0 p-0 grid gap-2">
        <Row
          ok={data.breakdown.consentsActive >= 90}
          label="Consents activos"
          value={`${formatPercent(data.breakdown.consentsActive)} (${data.detail.consentsWithRecord} de ${data.detail.consentsTotal})`}
        />
        <Row
          ok={data.detail.rtbfPending === 0}
          warn={data.detail.rtbfPending > 0 && data.breakdown.rtbfPendingDays <= 2}
          label="RtBF requests pendientes"
          value={
            data.detail.rtbfPending === 0
              ? "0 pendientes"
              : `${data.detail.rtbfPending} (${data.breakdown.rtbfPendingDays}d promedio)`
          }
        />
        <Row
          ok={data.breakdown.privacyNoticeVigente}
          label="Aviso de privacidad"
          value={`${data.detail.privacyNoticeVersion} vigente`}
        />
        <Row
          ok={data.breakdown.auditLogActive}
          label="Audit log"
          value={`${data.detail.auditLogRetentionDays} días retención`}
        />
        <Row
          ok={data.breakdown.dataResidencyMX}
          label="Datos en jurisdicción"
          value="MX 100%"
        />
      </ul>
    </article>
  );
}

function Row({
  ok,
  warn,
  label,
  value,
}: {
  ok: boolean;
  warn?: boolean;
  label: string;
  value: string;
}) {
  const symbol = ok ? "✓" : warn ? "⚠" : "✗";
  const tone = ok ? "text-ok" : warn ? "text-warn" : "text-err";
  return (
    <li className="grid grid-cols-[24px_1fr_auto] gap-3 items-center text-[15px]">
      <span aria-hidden className={cn("text-[16px] font-semibold", tone)}>
        {symbol}
      </span>
      <span>{label}</span>
      <span className="text-ink/70 tabular">{value}</span>
    </li>
  );
}

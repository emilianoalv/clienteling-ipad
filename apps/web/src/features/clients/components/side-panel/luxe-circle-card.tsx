import { getTranslations } from "next-intl/server";
import type { Client, Segment } from "@/types/client";
import { Card } from "@/components/patterns";
import { Chip, ProgressBar } from "@/components/primitives";
import { calculateLevelProgress } from "../../services/level-progress";
import { formatCurrency } from "@/lib/format/format-currency";

const SEGMENT_TONE = {
  VIP: "accent",
  Recurrent: "ok",
  New: "neutral",
  AtRisk: "danger",
} as const;

const SEGMENT_KEY = {
  VIP: "vip",
  Recurrent: "recurrent",
  New: "new",
  AtRisk: "at_risk",
} as const;

const PROGRESS_TONE = {
  VIP: "warn",
  Recurrent: "ok",
  New: "neutral",
  AtRisk: "danger",
} as const;

export async function LuxeCircleCard({ client, segment }: { client: Client; segment: Segment }) {
  const t = await getTranslations();
  const progress = calculateLevelProgress(client);
  const visits = client.stats.visits;

  return (
    <Card className="bg-gradient-to-b from-white to-bone">
      <div className="flex items-baseline justify-between">
        <span className="text-[15px] font-semibold tracking-[0.12em] uppercase text-ink/60">
          {t("profile.card.luxe_circle")}
        </span>
        <Chip variant={SEGMENT_TONE[segment]} size="sm">
          {t(`clients.segment.${SEGMENT_KEY[segment]}`)}
        </Chip>
      </div>

      <div className="mt-1.5 font-display text-[42px] leading-none tabular">{visits}</div>
      <div className="text-xs font-medium leading-snug text-ink/60">
        {visits === 1 ? "visita" : "visitas"} · {formatCurrency(client.stats.ltv)} LTV
      </div>

      <hr className="my-3 border-0 border-t border-dashed border-line" />

      <p className="mb-2 text-[16px] font-medium leading-snug">{progress.hint}</p>
      <ProgressBar
        value={progress.progress}
        tone={PROGRESS_TONE[progress.current]}
        ariaLabel={progress.hint}
      />
    </Card>
  );
}

import Link from "next/link";
import { Card, SectionHeader } from "@/components/patterns";
import { BrandTag, Chip, Icon, ProgressBar } from "@/components/primitives";
import { parseFilters } from "@/features/dashboards/lib/parse-filters";
import {
  getActiveClients,
  getAverageTicket,
  getRecoToPurchaseRate,
  getSalesAmount,
  getSalesByBrand,
} from "@/features/dashboards/server/queries";
import { requireSession } from "@/server/auth/session";
import { storeRepository } from "@/server/repositories/store.repository";
import { userRepository } from "@/server/repositories/user.repository";
import {
  formatCurrencyCompact,
  formatPercent,
} from "@/lib/format/number";
import type { SalesByBrandResult } from "@/features/dashboards/server/queries";
import type { StoreId } from "@/types/store";

/**
 * /supervisor/stores — directorio detallado de las tiendas en la zona
 * del supervisor (RF-54). Una card por tienda con KPIs del período y
 * drill-down al dashboard filtrado por esa tienda.
 *
 * Antes esta ruta no existía: el rail apuntaba aquí pero la page no se
 * había creado (404 + middleware redirect a /supervisor).
 */
export default async function SupervisorStoresPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const { staff } = await requireSession();
  if (staff.role !== "Supervisor") {
    throw new Error("Esta vista solo está disponible para el rol Supervisor.");
  }

  const filters = parseFilters(params, { defaultPeriod: "mtd" });

  const [allStores, users] = await Promise.all([
    storeRepository.list(),
    userRepository.list(),
  ]);

  const storesInScope = allStores.filter((s) => staff.storeIds.includes(s.id));

  const rows = await Promise.all(
    storesInScope.map(async (store) => {
      const storeFilters = { ...filters, storeIds: [store.id] };
      const [salesAmount, recoRate, avgTicket, activeClients, salesByBrand] =
        await Promise.all([
          getSalesAmount(staff, storeFilters),
          getRecoToPurchaseRate(staff, storeFilters),
          getAverageTicket(staff, storeFilters),
          getActiveClients(staff, storeFilters),
          getSalesByBrand(staff, storeFilters),
        ]);

      const bas = users.filter((u) => u.role === "BA" && u.storeId === store.id);
      const target = store.monthlyTarget ?? 0;
      const ratioPct = target > 0 ? (salesAmount / target) * 100 : 0;

      return {
        store,
        target,
        salesAmount,
        ratioPct,
        recoRate,
        avgTicket,
        activeClients,
        baTotal: bas.length,
        salesByBrand,
      };
    }),
  );

  // Top performer arriba. Quien tiene mejor % objetivo del periodo es
  // quien deja contento al supervisor; los rezagados quedan al final.
  rows.sort((a, b) => b.ratioPct - a.ratioPct);

  return (
    <section className="flex flex-col gap-5">
      <SectionHeader title="Tiendas" eyebrow="Mi zona" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {rows.map((row) => (
          <StoreRow key={row.store.id as unknown as string} {...row} />
        ))}
      </div>
    </section>
  );
}

interface StoreRowProps {
  store: { id: StoreId; name: string; address: string };
  target: number;
  salesAmount: number;
  ratioPct: number;
  recoRate: number;
  avgTicket: number;
  activeClients: number;
  baTotal: number;
  salesByBrand: SalesByBrandResult;
}

function StoreRow({
  store,
  target,
  salesAmount,
  ratioPct,
  recoRate,
  avgTicket,
  activeClients,
  baTotal,
  salesByBrand,
}: StoreRowProps) {
  const status = computeStatus(ratioPct);

  return (
    <Card variant="luxe" className="flex flex-col gap-4">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex flex-col gap-0.5">
          <h3 className="m-0 font-display text-[24px] leading-[1.05] tracking-[-0.01em]">
            {store.name}
          </h3>
          {store.address ? (
            <span className="text-[13.5px] text-ink/55 leading-snug truncate">
              {store.address}
            </span>
          ) : null}
        </div>
        <Chip variant={status.variant} size="sm">
          {status.label}
        </Chip>
      </header>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-display text-[28px] tabular leading-none">
            {formatCurrencyCompact(salesAmount)}
          </span>
          <span className="text-[14px] font-medium text-ink/60 tabular">
            {target > 0 ? `${Math.round(ratioPct)}% de ${formatCurrencyCompact(target)}` : "Sin objetivo"}
          </span>
        </div>
        <ProgressBar
          value={Math.min(ratioPct, 100)}
          aria-label="Avance vs objetivo"
        />
      </div>

      <div className="grid grid-cols-2 gap-x-5 gap-y-2 pt-2 border-t border-line">
        <MiniKpi label="Ticket promedio" value={formatCurrencyCompact(avgTicket)} />
        <MiniKpi label="Conv reco→compra" value={formatPercent(recoRate)} />
        <MiniKpi
          label="Clientes activos"
          value={String(activeClients)}
        />
        <MiniKpi label="BAs en piso" value={String(baTotal)} />
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-line">
        <BrandTag brand="Lancôme" alwaysShow />
        <span className="text-[13.5px] text-ink/60 tabular">
          {formatCurrencyCompact(salesByBrand.Lancome.salesAmount)}
        </span>
        <span aria-hidden className="text-ink/30">·</span>
        <BrandTag brand="YSL" alwaysShow />
        <span className="text-[13.5px] text-ink/60 tabular">
          {formatCurrencyCompact(salesByBrand.YSL.salesAmount)}
        </span>
      </div>

      <div className="flex justify-end mt-auto">
        <Link
          href={`/supervisor?storeId=${encodeURIComponent(store.id as unknown as string)}`}
          className="inline-flex items-center gap-1.5 h-10 px-4 rounded-md border border-line bg-white text-[15px] font-semibold text-ink no-underline hover:bg-bone transition-colors"
        >
          Ver en dashboard
          <Icon name="arrow-right" size={13} />
        </Link>
      </div>
    </Card>
  );
}

function MiniKpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[12.5px] font-semibold tracking-[0.06em] uppercase text-ink/55">
        {label}
      </span>
      <span className="font-display text-[18px] leading-none tabular">
        {value}
      </span>
    </div>
  );
}

function computeStatus(ratioPct: number): {
  variant: "ok" | "warn" | "danger";
  label: string;
} {
  if (ratioPct >= 100) return { variant: "ok", label: "Top" };
  if (ratioPct >= 70) return { variant: "warn", label: "En camino" };
  return { variant: "danger", label: "Urgente" };
}

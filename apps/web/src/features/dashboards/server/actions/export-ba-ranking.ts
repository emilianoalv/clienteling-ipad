"use server";

import { requireSession } from "@/server/auth/session";
import { userRepository } from "@/server/repositories/user.repository";
import type { ExportColumn, ExportFormat } from "@/lib/export";
import { getBaRanking } from "../queries/get-ba-ranking";
import { getRecoToPurchaseRate } from "../queries/get-reco-to-purchase-rate";
import { getSampleToPurchaseRate } from "../queries/get-sample-to-purchase-rate";
import { thisMonth } from "../utils/date-ranges";
import { RoleNotPermittedError } from "../errors";
import { packArtifact, type ExportArtifact } from "./_artifact";

interface RankingRow {
  rank: number;
  ba: string;
  tienda: string;
  marca: string;
  ventas: number;
  porcentajeObjetivo: number | null;
  convReco: number;
  convSample: number;
  estado: string;
}

const COLUMNS: ReadonlyArray<ExportColumn<RankingRow>> = [
  { key: "rank", label: "#", width: 6, format: "number" },
  { key: "ba", label: "BA", width: 24 },
  { key: "tienda", label: "Tienda", width: 22 },
  { key: "marca", label: "Marca", width: 12 },
  { key: "ventas", label: "Ventas", width: 14, format: "currency-mxn" },
  {
    key: "porcentajeObjetivo",
    label: "% objetivo",
    width: 12,
    format: "percent",
  },
  { key: "convReco", label: "Conv reco→compra", width: 18, format: "percent" },
  {
    key: "convSample",
    label: "Conv sample→compra",
    width: 20,
    format: "percent",
  },
  { key: "estado", label: "Estado", width: 16 },
];

export async function exportBaRanking(
  format: ExportFormat,
): Promise<ExportArtifact> {
  const { staff } = await requireSession();
  if (staff.role === "BA") {
    throw new RoleNotPermittedError(staff.role, "exportBaRanking");
  }

  const filters = { period: thisMonth() };

  const [ranking, users] = await Promise.all([
    getBaRanking(staff, filters, { topN: 50 }),
    userRepository.list(),
  ]);

  const targetByBaId = new Map<string, number>();
  for (const u of users) {
    if (u.role !== "BA" || !u.monthlyTarget) continue;
    targetByBaId.set(u.id as unknown as string, u.monthlyTarget);
  }

  // Per-BA conv reco + sample are not in the ranking row. Fetch in parallel.
  const aux = await Promise.all(
    ranking.map(async (entry) => {
      const baFilters = { ...filters, baId: entry.baId };
      const [reco, sample] = await Promise.all([
        getRecoToPurchaseRate(staff, baFilters),
        getSampleToPurchaseRate(staff, baFilters),
      ]);
      return { baId: entry.baId, reco, sample };
    }),
  );
  const auxByBaId = new Map<string, { reco: number; sample: number }>();
  for (const a of aux) {
    auxByBaId.set(a.baId as unknown as string, {
      reco: a.reco,
      sample: a.sample,
    });
  }

  const rows: RankingRow[] = ranking.map((entry) => {
    const target = targetByBaId.get(entry.baId as unknown as string) ?? 0;
    const ratio = target > 0 ? (entry.salesAmount / target) * 100 : null;
    const status = computeStatus(ratio);
    const a = auxByBaId.get(entry.baId as unknown as string) ?? {
      reco: 0,
      sample: 0,
    };
    return {
      rank: entry.rank,
      ba: entry.name,
      tienda: entry.storeName,
      marca: entry.brand,
      ventas: entry.salesAmount,
      porcentajeObjetivo: ratio,
      convReco: a.reco,
      convSample: a.sample,
      estado: status,
    };
  });

  return packArtifact(
    {
      format,
      sheetName: "Ranking BAs",
      columns: COLUMNS,
      rows,
      metadata: {
        title: "Ranking de BAs — L'Oréal Luxe México",
        filters: {
          Período: formatPeriod(filters.period),
          Scope: scopeLabelFor(staff),
        },
        generatedAt: new Date(),
        generatedBy: `${staff.name} (${staff.role})`,
      },
    },
    "ranking-bas",
    {
      role: staff.role,
      identifier: staff.name,
      period: filters.period,
    },
  );
}

function computeStatus(ratio: number | null): string {
  if (ratio === null) return "Sin objetivo";
  if (ratio >= 100) return "Top";
  if (ratio >= 70) return "En camino";
  return "Urgente";
}

function scopeLabelFor(staff: { role: string }): string {
  return staff.role;
}

function formatPeriod(period: { from: Date; to: Date }): string {
  const opts: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  };
  const from = new Intl.DateTimeFormat("es-MX", opts).format(period.from);
  const to = new Intl.DateTimeFormat("es-MX", opts).format(period.to);
  return `${from} — ${to}`;
}

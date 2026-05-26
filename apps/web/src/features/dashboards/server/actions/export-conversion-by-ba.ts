"use server";

import { requireSession } from "@/server/auth/session";
import { followupTaskRepository } from "@/server/repositories/followup-task.repository";
import { interactionRepository } from "@/server/repositories/interaction.repository";
import { recommendationRepository } from "@/server/repositories/recommendation.repository";
import { storeRepository } from "@/server/repositories/store.repository";
import { userRepository } from "@/server/repositories/user.repository";
import type { ExportColumn, ExportFormat } from "@/lib/export";
import { mergeScope } from "../utils/scope-merge";
import { RoleNotPermittedError } from "../errors";
import { packArtifact, type ExportArtifact } from "./_artifact";
import type { DashboardFilters } from "../types";

/**
 * RF-47 — Tasa de conversión por BA con dos métricas:
 *
 * - **Reco → compra**: % de recomendaciones del BA en el período cuyo
 *   `status === "converted"` (la BA logró que la clienta comprara lo
 *   que le sugirió verbalmente).
 *
 * - **Seguimiento → revisita**: % de tareas de seguimiento completadas
 *   por el BA en el período donde la clienta tuvo al menos una
 *   interaction adicional dentro de los 30 días posteriores al
 *   completedAt. Mide qué tan efectivos son los outreach del BA en
 *   traer de vuelta a la clienta al mostrador.
 *
 * El "revisita" se cuenta contra cualquier interaction (no solo
 * compras) porque el objetivo del seguimiento es traer a la clienta
 * de vuelta — la venta es consecuencia. Pegar el bar a "compra" sería
 * demasiado estricto para una métrica de outreach.
 */
interface ConversionRow {
  ba: string;
  tienda: string;
  marca: string;
  recoTotal: number;
  recoConvertidas: number;
  tasaReco: number;
  seguimientosCompletados: number;
  revisitas: number;
  tasaRevisita: number;
}

const REVISIT_WINDOW_DAYS = 30;

const COLUMNS: ReadonlyArray<ExportColumn<ConversionRow>> = [
  { key: "ba", label: "BA", width: 24 },
  { key: "tienda", label: "Tienda", width: 22 },
  { key: "marca", label: "Marca", width: 12 },
  { key: "recoTotal", label: "Recos hechas", width: 14, format: "number" },
  { key: "recoConvertidas", label: "Recos compradas", width: 16, format: "number" },
  { key: "tasaReco", label: "% Reco → compra", width: 17, format: "percent" },
  {
    key: "seguimientosCompletados",
    label: "Seguimientos completados",
    width: 22,
    format: "number",
  },
  { key: "revisitas", label: "Revisitas (30d)", width: 16, format: "number" },
  {
    key: "tasaRevisita",
    label: "% Seguimiento → revisita",
    width: 24,
    format: "percent",
  },
];

export async function exportConversionByBa(
  filters: DashboardFilters,
  format: ExportFormat,
): Promise<ExportArtifact> {
  const { staff } = await requireSession();
  if (staff.role === "BA") {
    throw new RoleNotPermittedError(staff.role, "exportConversionByBa");
  }

  const { storeIds, brands, isEmpty } = mergeScope(staff, filters);

  if (isEmpty) {
    return packArtifact(
      { format, sheetName: "Conversión BA", columns: COLUMNS, rows: [] },
      "conversion-ba",
      contextFor(staff, filters),
    );
  }

  const [users, stores, recommendations, followups, interactions] =
    await Promise.all([
      userRepository.list(),
      storeRepository.list(),
      recommendationRepository.list({ storeIds, brands }),
      followupTaskRepository.list({ status: "done" }),
      interactionRepository.list({ storeIds, brands }),
    ]);

  const storeNameById = new Map<string, string>();
  for (const s of stores) storeNameById.set(s.id as unknown as string, s.name);

  const storeSet = storeIds ? new Set(storeIds) : null;
  const brandSet = brands ? new Set(brands) : null;

  const candidates = users.filter(
    (u) =>
      u.role === "BA" &&
      u.storeId &&
      u.brand &&
      (!storeSet || storeSet.has(u.storeId)) &&
      (!brandSet || brandSet.has(u.brand)),
  );

  const { from, to } = filters.period;
  const fromTime = from.getTime();
  const toTime = to.getTime();

  // Pre-indexa interactions por clientId para que el cómputo de
  // "revisita en 30d" no sea O(F * I) por BA.
  const interactionsByClient = new Map<string, number[]>();
  for (const i of interactions) {
    const ts = new Date(i.at).getTime();
    if (Number.isNaN(ts)) continue;
    const key = i.clientId as unknown as string;
    const bucket = interactionsByClient.get(key);
    if (bucket) bucket.push(ts);
    else interactionsByClient.set(key, [ts]);
  }

  const rows: ConversionRow[] = candidates
    .map((u) => {
      const baId = u.id as unknown as string;

      const baRecs = recommendations.filter(
        (r) =>
          (r.baId as unknown as string) === baId &&
          inPeriod(r.at, fromTime, toTime),
      );
      const recoTotal = baRecs.length;
      const recoConvertidas = baRecs.filter((r) => r.status === "converted").length;
      const tasaReco = recoTotal === 0 ? 0 : (recoConvertidas / recoTotal) * 100;

      const baFollowups = followups.filter(
        (t) =>
          (t.baId as unknown as string) === baId &&
          t.completedAt !== undefined &&
          inPeriod(t.completedAt, fromTime, toTime),
      );
      const seguimientosCompletados = baFollowups.length;

      const revisitas = baFollowups.filter((t) => {
        const completedTs = new Date(t.completedAt!).getTime();
        if (Number.isNaN(completedTs)) return false;
        const windowEnd = completedTs + REVISIT_WINDOW_DAYS * 86_400_000;
        const bucket = interactionsByClient.get(t.clientId as unknown as string);
        if (!bucket) return false;
        return bucket.some((ts) => ts > completedTs && ts <= windowEnd);
      }).length;
      const tasaRevisita =
        seguimientosCompletados === 0
          ? 0
          : (revisitas / seguimientosCompletados) * 100;

      return {
        ba: u.name,
        tienda: storeNameById.get(u.storeId as unknown as string) ?? "—",
        marca: u.brand!,
        recoTotal,
        recoConvertidas,
        tasaReco,
        seguimientosCompletados,
        revisitas,
        tasaRevisita,
      };
    })
    .sort((a, b) => {
      if (b.tasaReco !== a.tasaReco) return b.tasaReco - a.tasaReco;
      return a.ba.localeCompare(b.ba);
    });

  return packArtifact(
    {
      format,
      sheetName: "Conversión BA",
      columns: COLUMNS,
      rows,
      metadata: {
        title: "Tasa de conversión por BA — L'Oréal Luxe México",
        filters: {
          Período: formatPeriod(filters.period),
          Marca: brands?.join(", ") ?? "Todas",
          Tienda:
            (storeIds ?? [])
              .map((id) => storeNameById.get(id as unknown as string) ?? id)
              .join(", ") || "Todas",
          "Ventana revisita": `${REVISIT_WINDOW_DAYS} días post-completion`,
        },
        generatedAt: new Date(),
        generatedBy: `${staff.name} (${staff.role})`,
      },
    },
    "conversion-ba",
    contextFor(staff, filters),
  );
}

function inPeriod(iso: string, fromTime: number, toTime: number): boolean {
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return false;
  return ts >= fromTime && ts < toTime;
}

function contextFor(
  staff: { role: string; name: string },
  filters: { period: { from: Date; to: Date } },
) {
  return {
    role: staff.role,
    identifier: staff.name,
    period: filters.period,
  };
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

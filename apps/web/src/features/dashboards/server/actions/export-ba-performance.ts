"use server";

import { requireSession } from "@/server/auth/session";
import { clientRepository } from "@/server/repositories/client.repository";
import { followupTaskRepository } from "@/server/repositories/followup-task.repository";
import { purchaseRepository } from "@/server/repositories/purchase.repository";
import { recommendationRepository } from "@/server/repositories/recommendation.repository";
import { storeRepository } from "@/server/repositories/store.repository";
import { userRepository } from "@/server/repositories/user.repository";
import type { ExportColumn, ExportFormat } from "@/lib/export";
import { mergeScope } from "../utils/scope-merge";
import { RoleNotPermittedError } from "../errors";
import { packArtifact, type ExportArtifact } from "./_artifact";
import type { DashboardFilters } from "../types";

/**
 * RF-45 — Reporte de desempeño operativo por BA. Una fila por cada BA
 * dentro del scope tienda+marca del rol, con los conteos de actividad
 * en el período: # transacciones cobradas, # clientes registrados por
 * primera vez (createdByBaId), # tareas de seguimiento completadas,
 * # recomendaciones hechas.
 *
 * Complementa exportBaRanking (que es centrado en $) — aquí el foco
 * es la actividad operativa que pide el RF, útil para evaluaciones
 * de productividad. BA bloqueado: usar exportBaSales para uno mismo.
 */
interface PerformanceRow {
  ba: string;
  tienda: string;
  marca: string;
  transacciones: number;
  registros: number;
  seguimientos: number;
  recomendaciones: number;
}

const COLUMNS: ReadonlyArray<ExportColumn<PerformanceRow>> = [
  { key: "ba", label: "BA", width: 24 },
  { key: "tienda", label: "Tienda", width: 22 },
  { key: "marca", label: "Marca", width: 12 },
  { key: "transacciones", label: "Transacciones", width: 14, format: "number" },
  {
    key: "registros",
    label: "Clientes registrados",
    width: 18,
    format: "number",
  },
  {
    key: "seguimientos",
    label: "Seguimientos completados",
    width: 22,
    format: "number",
  },
  {
    key: "recomendaciones",
    label: "Recomendaciones",
    width: 16,
    format: "number",
  },
];

export async function exportBaPerformance(
  filters: DashboardFilters,
  format: ExportFormat,
): Promise<ExportArtifact> {
  const { staff } = await requireSession();
  if (staff.role === "BA") {
    throw new RoleNotPermittedError(staff.role, "exportBaPerformance");
  }

  const { storeIds, brands, isEmpty } = mergeScope(staff, filters);

  if (isEmpty) {
    return packArtifact(
      { format, sheetName: "Desempeño BA", columns: COLUMNS, rows: [] },
      "desempeno-ba",
      contextFor(staff, filters),
    );
  }

  const [users, stores, purchases, recommendations, clients, followups] =
    await Promise.all([
      userRepository.list(),
      storeRepository.list(),
      purchaseRepository.list({ storeIds, brands }),
      recommendationRepository.list({ storeIds, brands }),
      clientRepository.list({ storeIds, brands }),
      followupTaskRepository.list({ status: "done" }),
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

  const rows: PerformanceRow[] = candidates
    .map((u) => {
      const baId = u.id as unknown as string;
      const txCount = purchases.filter(
        (p) =>
          (p.baId as unknown as string) === baId &&
          inPeriod(p.at, fromTime, toTime),
      ).length;
      const registros = clients.filter(
        (c) =>
          (c.createdByBaId as unknown as string) === baId &&
          inPeriod(c.since, fromTime, toTime),
      ).length;
      const seguimientos = followups.filter(
        (t) =>
          (t.baId as unknown as string) === baId &&
          t.completedAt !== undefined &&
          inPeriod(t.completedAt, fromTime, toTime),
      ).length;
      const recs = recommendations.filter(
        (r) =>
          (r.baId as unknown as string) === baId &&
          inPeriod(r.at, fromTime, toTime),
      ).length;
      return {
        ba: u.name,
        tienda: storeNameById.get(u.storeId as unknown as string) ?? "—",
        marca: u.brand!,
        transacciones: txCount,
        registros,
        seguimientos,
        recomendaciones: recs,
      };
    })
    .sort((a, b) => {
      const aTotal = a.transacciones + a.registros + a.seguimientos + a.recomendaciones;
      const bTotal = b.transacciones + b.registros + b.seguimientos + b.recomendaciones;
      if (bTotal !== aTotal) return bTotal - aTotal;
      return a.ba.localeCompare(b.ba);
    });

  return packArtifact(
    {
      format,
      sheetName: "Desempeño BA",
      columns: COLUMNS,
      rows,
      metadata: {
        title: "Desempeño por BA — L'Oréal Luxe México",
        filters: {
          Período: formatPeriod(filters.period),
          Marca: brands?.join(", ") ?? "Todas",
          Tienda:
            (storeIds ?? [])
              .map((id) => storeNameById.get(id as unknown as string) ?? id)
              .join(", ") || "Todas",
        },
        generatedAt: new Date(),
        generatedBy: `${staff.name} (${staff.role})`,
      },
    },
    "desempeno-ba",
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

"use server";

import { clientRepository } from "@/server/repositories/client.repository";
import { followupTaskRepository } from "@/server/repositories/followup-task.repository";
import { interactionRepository } from "@/server/repositories/interaction.repository";
import { purchaseRepository } from "@/server/repositories/purchase.repository";
import { storeRepository } from "@/server/repositories/store.repository";
import { userRepository } from "@/server/repositories/user.repository";
import { requireSession } from "@/server/auth/session";
import type { ExportColumn, ExportFormat } from "@/lib/export";
import { mergeScope } from "../utils/scope-merge";
import type { DashboardFilters } from "../types";
import { packArtifact, type ExportArtifact } from "./_artifact";
import { followupTypeLabel } from "./_labels";

interface ClientRow {
  nombre: string;
  apellido: string;
  telefono: string;
  fechaNacimiento: Date | null;
  ultimoBa: string;
  clienteDesde: Date | null;
  fechaUltimoContacto: Date | null;
  fechaUltimaTransaccion: Date | null;
  tipoSeguimiento: string;
}

const COLUMNS: ReadonlyArray<ExportColumn<ClientRow>> = [
  { key: "nombre", label: "Nombre", width: 20 },
  { key: "apellido", label: "Apellido", width: 20 },
  { key: "telefono", label: "Teléfono", width: 16 },
  {
    key: "fechaNacimiento",
    label: "Fecha de nacimiento",
    format: "date",
    width: 18,
  },
  { key: "ultimoBa", label: "Último BA", width: 24 },
  { key: "clienteDesde", label: "Cliente desde", format: "date", width: 15 },
  {
    key: "fechaUltimoContacto",
    label: "Último contacto",
    format: "date",
    width: 17,
  },
  {
    key: "fechaUltimaTransaccion",
    label: "Última transacción",
    format: "date",
    width: 18,
  },
  { key: "tipoSeguimiento", label: "Tipo de seguimiento", width: 22 },
];

export async function exportClientsReport(
  filters: DashboardFilters,
  format: ExportFormat,
): Promise<ExportArtifact> {
  const { staff } = await requireSession();
  const { storeIds, brands, isEmpty } = mergeScope(staff, filters);

  if (isEmpty) {
    return packArtifact(
      { format, sheetName: "Clientes", columns: COLUMNS, rows: [] },
      "reporte-clientes",
      contextFor(staff, filters),
    );
  }

  const [clients, users, stores] = await Promise.all([
    clientRepository.list({ storeIds, brands }),
    userRepository.list(),
    storeRepository.list(),
  ]);

  const userNameById = new Map<string, string>();
  for (const u of users) userNameById.set(u.id as unknown as string, u.name);
  const storeNameById = new Map<string, string>();
  for (const s of stores) storeNameById.set(s.id as unknown as string, s.name);

  const rows: ClientRow[] = await Promise.all(
    clients.map((c) => buildRow(c.id, c, userNameById)),
  );

  return packArtifact(
    {
      format,
      sheetName: "Clientes",
      columns: COLUMNS,
      rows,
      metadata: {
        title: "Reporte de clientes — L'Oréal Luxe México",
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
    "reporte-clientes",
    contextFor(staff, filters),
  );
}

async function buildRow(
  clientId: import("@/types/client").ClientId,
  client: import("@/types/client").Client,
  userNameById: Map<string, string>,
): Promise<ClientRow> {
  const [purchases, interactions, followups] = await Promise.all([
    purchaseRepository.listByClient(clientId),
    interactionRepository.listByClient(clientId),
    followupTaskRepository.listByClient(clientId),
  ]);

  const splitName = client.name.split(" ");
  const nombre = splitName[0] ?? client.name;
  const apellido = splitName.slice(1).join(" ");

  const lastPurchase = purchases
    .slice()
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())[0];
  const lastInteraction = interactions
    .slice()
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())[0];
  const lastBaId =
    lastPurchase?.baId ?? lastInteraction?.baId ?? null;
  const lastFollowup = followups
    .slice()
    .sort(
      (a, b) =>
        new Date(b.dueAt).getTime() - new Date(a.dueAt).getTime(),
    )[0];

  return {
    nombre,
    apellido,
    telefono: client.phone,
    fechaNacimiento: client.birthday ? new Date(client.birthday) : null,
    ultimoBa:
      lastBaId !== null
        ? userNameById.get(lastBaId as unknown as string) ?? "—"
        : "—",
    clienteDesde: client.since ? new Date(client.since) : null,
    fechaUltimoContacto: lastInteraction
      ? new Date(lastInteraction.at)
      : null,
    fechaUltimaTransaccion: lastPurchase ? new Date(lastPurchase.at) : null,
    tipoSeguimiento: lastFollowup ? followupTypeLabel(lastFollowup.type) : "—",
  };
}

function contextFor(
  staff: { role: string; name: string },
  filters: DashboardFilters,
): { role: string; identifier: string; period: { from: Date; to: Date } } {
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

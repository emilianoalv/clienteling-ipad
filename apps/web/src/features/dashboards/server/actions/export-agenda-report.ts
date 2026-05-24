"use server";

import { appointmentRepository } from "@/server/repositories/appointment.repository";
import { clientRepository } from "@/server/repositories/client.repository";
import { userRepository } from "@/server/repositories/user.repository";
import { storeRepository } from "@/server/repositories/store.repository";
import { requireSession } from "@/server/auth/session";
import type { ExportColumn, ExportFormat } from "@/lib/export";
import { mergeScope } from "../utils/scope-merge";
import { thisMonth } from "../utils/date-ranges";
import { packArtifact, type ExportArtifact } from "./_artifact";
import { appointmentKindLabel, appointmentStatusLabel } from "./_labels";
import type { DashboardFilters } from "../types";

interface AgendaRow {
  nombre: string;
  apellido: string;
  telefono: string;
  fechaCita: Date;
  tipoEvento: string;
  comentario: string;
  baAsignado: string;
  estado: string;
}

const COLUMNS: ReadonlyArray<ExportColumn<AgendaRow>> = [
  { key: "nombre", label: "Nombre", width: 20 },
  { key: "apellido", label: "Apellido", width: 20 },
  { key: "telefono", label: "Teléfono", width: 16 },
  {
    key: "fechaCita",
    label: "Fecha de cita",
    format: "datetime",
    width: 20,
  },
  { key: "tipoEvento", label: "Tipo de evento", width: 22 },
  { key: "comentario", label: "Comentario", width: 28 },
  { key: "baAsignado", label: "BA asignado", width: 24 },
  { key: "estado", label: "Estado", width: 14 },
];

export async function exportAgendaReport(
  format: ExportFormat,
): Promise<ExportArtifact> {
  const { staff } = await requireSession();
  const filters: DashboardFilters = { period: thisMonth() };
  const { storeIds, brands, isEmpty } = mergeScope(staff, filters);

  if (isEmpty) {
    return packArtifact(
      { format, sheetName: "Agenda", columns: COLUMNS, rows: [] },
      "reporte-agenda",
      contextFor(staff, filters),
    );
  }

  const [appointments, clients, users, stores] = await Promise.all([
    appointmentRepository.list({
      storeIds,
      brands,
      from: filters.period.from,
      to: filters.period.to,
    }),
    clientRepository.list({ storeIds, brands }),
    userRepository.list(),
    storeRepository.list(),
  ]);

  const clientById = new Map<string, (typeof clients)[number]>();
  for (const c of clients) clientById.set(c.id as unknown as string, c);
  const userNameById = new Map<string, string>();
  for (const u of users) userNameById.set(u.id as unknown as string, u.name);
  const storeNameById = new Map<string, string>();
  for (const s of stores) storeNameById.set(s.id as unknown as string, s.name);

  const rows: AgendaRow[] = appointments
    .slice()
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
    .map((a) => {
      const client = clientById.get(a.clientId as unknown as string);
      const splitName = client?.name.split(" ") ?? [];
      return {
        nombre: splitName[0] ?? client?.name ?? "—",
        apellido: splitName.slice(1).join(" "),
        telefono: client?.phone ?? "—",
        fechaCita: new Date(a.at),
        tipoEvento: appointmentKindLabel(a.kind),
        comentario: a.notes ?? "",
        baAsignado:
          userNameById.get(a.baId as unknown as string) ?? a.baId,
        estado: appointmentStatusLabel(a.status),
      };
    });

  return packArtifact(
    {
      format,
      sheetName: "Agenda",
      columns: COLUMNS,
      rows,
      metadata: {
        title: "Reporte de agenda — L'Oréal Luxe México",
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
    "reporte-agenda",
    contextFor(staff, filters),
  );
}

function contextFor(
  staff: { role: string; name: string },
  filters: DashboardFilters,
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

"use server";

import { requireSession } from "@/server/auth/session";
import { clientRepository } from "@/server/repositories/client.repository";
import { purchaseRepository } from "@/server/repositories/purchase.repository";
import { storeRepository } from "@/server/repositories/store.repository";
import type { ExportColumn, ExportFormat } from "@/lib/export";
import { mergeScope } from "../utils/scope-merge";
import { thisMonth } from "../utils/date-ranges";
import { packArtifact, type ExportArtifact } from "./_artifact";

interface SaleRow {
  fecha: Date;
  ticket: string;
  cliente: string;
  productos: string;
  marca: string;
  total: number;
  ba: string;
}

const COLUMNS: ReadonlyArray<ExportColumn<SaleRow>> = [
  { key: "fecha", label: "Fecha", format: "datetime", width: 20 },
  { key: "ticket", label: "Ticket #", width: 14 },
  { key: "cliente", label: "Cliente", width: 26 },
  { key: "productos", label: "Productos", width: 40 },
  { key: "marca", label: "Marca", width: 12 },
  { key: "total", label: "Total", width: 14, format: "currency-mxn" },
  { key: "ba", label: "BA", width: 22 },
];

export async function exportBaSales(
  format: ExportFormat,
): Promise<ExportArtifact> {
  const { staff } = await requireSession();
  const filters = { period: thisMonth() };
  const { storeIds, brands, isEmpty } = mergeScope(staff, filters);

  if (isEmpty) {
    return packArtifact(
      { format, sheetName: "Ventas", columns: COLUMNS, rows: [] },
      "ventas-ba",
      contextFor(staff, filters),
    );
  }

  const [purchases, clients, stores] = await Promise.all([
    purchaseRepository.list({ storeIds, brands }),
    clientRepository.list({ storeIds, brands }),
    storeRepository.list(),
  ]);

  const clientNameById = new Map<string, string>();
  for (const c of clients) clientNameById.set(c.id as unknown as string, c.name);
  const storeNameById = new Map<string, string>();
  for (const s of stores) storeNameById.set(s.id as unknown as string, s.name);

  // BA scope: only own purchases.
  const myStaffId = staff.id as unknown as string;
  const rows: SaleRow[] = purchases
    .filter((p) => {
      const at = new Date(p.at);
      if (at < filters.period.from || at >= filters.period.to) return false;
      return staff.role === "BA"
        ? (p.baId as unknown as string) === myStaffId
        : true;
    })
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .map((p) => ({
      fecha: new Date(p.at),
      ticket: p.ticketRef ?? (p.id as unknown as string),
      cliente:
        clientNameById.get(p.clientId as unknown as string) ?? "—",
      productos: p.items
        .map((i) => `${i.sku as unknown as string} ×${i.qty}`)
        .join(" · "),
      marca: p.brand ?? "—",
      total: p.total,
      ba: staff.name,
    }));

  return packArtifact(
    {
      format,
      sheetName: "Ventas",
      columns: COLUMNS,
      rows,
      metadata: {
        title: "Ventas — L'Oréal Luxe México",
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
    "ventas-ba",
    contextFor(staff, filters),
  );
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

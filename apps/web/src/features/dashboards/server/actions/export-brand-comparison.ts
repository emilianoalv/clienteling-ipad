"use server";

import { requireSession } from "@/server/auth/session";
import type { ExportColumn, ExportFormat, ExportSheet } from "@/lib/export";
import { getSalesByBrand } from "../queries/get-sales-by-brand";
import { RoleNotPermittedError } from "../errors";
import { packArtifact, type ExportArtifact } from "./_artifact";
import type { DashboardFilters } from "../types";

interface SummaryRow {
  marca: string;
  ventas: number;
  participacion: number; // 0-100
  transacciones: number;
  ticketPromedio: number;
  conversion: number;
  clientesActivos: number;
}

interface ProductRow {
  marca: string;
  sku: string;
  producto: string;
  ingresos: number;
}

const SUMMARY_COLUMNS: ReadonlyArray<ExportColumn<SummaryRow>> = [
  { key: "marca", label: "Marca", width: 16 },
  { key: "ventas", label: "Ventas", width: 16, format: "currency-mxn" },
  { key: "participacion", label: "% del total", width: 12, format: "percent" },
  {
    key: "transacciones",
    label: "Transacciones",
    width: 14,
    format: "number",
  },
  {
    key: "ticketPromedio",
    label: "Ticket promedio",
    width: 16,
    format: "currency-mxn",
  },
  {
    key: "conversion",
    label: "Conv reco→compra",
    width: 18,
    format: "percent",
  },
  {
    key: "clientesActivos",
    label: "Clientes activos",
    width: 16,
    format: "number",
  },
];

const PRODUCT_COLUMNS: ReadonlyArray<ExportColumn<ProductRow>> = [
  { key: "marca", label: "Marca", width: 12 },
  { key: "sku", label: "SKU", width: 16 },
  { key: "producto", label: "Producto", width: 32 },
  { key: "ingresos", label: "Ingresos", width: 14, format: "currency-mxn" },
];

export async function exportBrandComparison(
  filters: DashboardFilters,
  format: ExportFormat,
): Promise<ExportArtifact> {
  const { staff } = await requireSession();
  if (staff.role === "BA") {
    throw new RoleNotPermittedError(staff.role, "exportBrandComparison");
  }

  const data = await getSalesByBrand(staff, filters);
  const total = data.Lancome.salesAmount + data.YSL.salesAmount;

  const summaryRows: SummaryRow[] = [
    {
      marca: "Lancôme",
      ventas: data.Lancome.salesAmount,
      participacion: total > 0 ? (data.Lancome.salesAmount / total) * 100 : 0,
      transacciones: data.Lancome.transactionsCount,
      ticketPromedio: data.Lancome.averageTicket,
      conversion: data.Lancome.reco2PurchaseRate * 100,
      clientesActivos: data.Lancome.activeClients,
    },
    {
      marca: "YSL",
      ventas: data.YSL.salesAmount,
      participacion: total > 0 ? (data.YSL.salesAmount / total) * 100 : 0,
      transacciones: data.YSL.transactionsCount,
      ticketPromedio: data.YSL.averageTicket,
      conversion: data.YSL.reco2PurchaseRate * 100,
      clientesActivos: data.YSL.activeClients,
    },
  ];

  const productRows: ProductRow[] = [
    ...data.Lancome.topProducts.map((p) => ({
      marca: "Lancôme",
      sku: p.sku,
      producto: p.productName,
      ingresos: p.revenue,
    })),
    ...data.YSL.topProducts.map((p) => ({
      marca: "YSL",
      sku: p.sku,
      producto: p.productName,
      ingresos: p.revenue,
    })),
  ];

  const sheets: ExportSheet<unknown>[] = [
    {
      sheetName: "Resumen",
      columns: SUMMARY_COLUMNS as ReadonlyArray<ExportColumn<unknown>>,
      rows: summaryRows,
    },
    {
      sheetName: "Top productos",
      columns: PRODUCT_COLUMNS as ReadonlyArray<ExportColumn<unknown>>,
      rows: productRows,
    },
  ];

  return packArtifact(
    {
      format,
      sheets,
      metadata: {
        title: "Comparativa Lancôme · YSL",
        filters: {
          Período: formatPeriod(filters.period),
          Scope: staff.role,
        },
        generatedAt: new Date(),
        generatedBy: `${staff.name} (${staff.role})`,
      },
    },
    "comparativa-marcas",
    {
      role: staff.role,
      identifier: staff.name,
      period: filters.period,
    },
  );
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

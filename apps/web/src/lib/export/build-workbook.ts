import * as XLSX from "xlsx";
import type {
  ExportColumn,
  ExportColumnFormat,
  ExportMetadata,
  ExportRequest,
  ExportSheet,
} from "./types";

/**
 * Build a workbook (Blob) ready to download. Single-sheet via
 * `columns`/`rows`, multi-sheet via `sheets`. CSV always returns one sheet
 * (the first one when `sheets` is used) with a UTF-8 BOM so Excel renders
 * accented characters correctly.
 *
 * Formatting (Excel only):
 *   - `currency-mxn` → `$#,##0.00 "MXN"`
 *   - `currency`     → `$#,##0.00`
 *   - `percent`      → `0.0"%"`  (value is interpreted 0-100)
 *   - `date`         → `dd/mm/yyyy`
 *   - `datetime`     → `dd/mm/yyyy hh:mm`
 *
 * Header row is rendered as plain bold via cell style. The optional
 * metadata block lands ABOVE the table (title, filters, "generado por").
 */

const DEFAULT_COL_WIDTH = 18;

export function buildWorkbook<T>(req: ExportRequest<T>): Blob {
  const { bytes, mimeType } = buildWorkbookBytes(req);
  // Copy into a fresh ArrayBuffer to satisfy Blob's BlobPart type (some TS
  // libs reject Uint8Array<SharedArrayBuffer>).
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return new Blob([buffer], { type: mimeType });
}

/**
 * Same workbook, returned as raw bytes + MIME. Useful from server-only code
 * (no Blob constructor needed) and from tests that prefer to inspect the
 * buffer directly without round-tripping through `Blob#arrayBuffer()`.
 */
export function buildWorkbookBytes<T>(req: ExportRequest<T>): {
  bytes: Uint8Array;
  mimeType: string;
} {
  const sheets = normalizeSheets(req);
  if (req.format === "csv") {
    return {
      bytes: csvBytes(sheets[0]!),
      mimeType: "text/csv;charset=utf-8",
    };
  }
  return {
    bytes: xlsxBytes(sheets, req.metadata),
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
}

function normalizeSheets<T>(
  req: ExportRequest<T>,
): ExportSheet<unknown>[] {
  if (req.sheets && req.sheets.length > 0) return [...req.sheets];
  if (!req.columns || !req.rows) {
    throw new Error(
      "ExportRequest requires either `sheets` or both `columns` and `rows`.",
    );
  }
  return [
    {
      sheetName: req.sheetName ?? "Reporte",
      columns: req.columns as ReadonlyArray<ExportColumn<unknown>>,
      rows: req.rows as ReadonlyArray<unknown>,
    },
  ];
}

// ── CSV ────────────────────────────────────────────────────────────────────

function csvBytes(sheet: ExportSheet<unknown>): Uint8Array {
  const headerLine = sheet.columns
    .map((c) => csvEscape(c.label))
    .join(",");

  const dataLines = sheet.rows.map((row) =>
    sheet.columns
      .map((col) => csvEscape(formatCsvCell(getCell(row, col), col.format)))
      .join(","),
  );

  // BOM ensures Excel auto-detects UTF-8 (otherwise accents break).
  const body = "﻿" + [headerLine, ...dataLines].join("\r\n");
  return new TextEncoder().encode(body);
}

function csvEscape(value: string): string {
  if (value.includes('"') || value.includes(",") || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatCsvCell(value: unknown, format?: ExportColumnFormat): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) {
    return format === "datetime"
      ? formatDateTimeForExport(value)
      : formatDateForExport(value);
  }
  if (format === "percent" && typeof value === "number") {
    return `${value.toFixed(1)}%`;
  }
  if (
    (format === "currency" || format === "currency-mxn") &&
    typeof value === "number"
  ) {
    return value.toFixed(2);
  }
  return String(value);
}

// ── XLSX ───────────────────────────────────────────────────────────────────

function xlsxBytes(
  sheets: ReadonlyArray<ExportSheet<unknown>>,
  metadata: ExportMetadata | undefined,
): Uint8Array {
  const wb = XLSX.utils.book_new();
  for (const sheet of sheets) {
    const ws = renderSheet(sheet, metadata);
    XLSX.utils.book_append_sheet(wb, ws, sanitizeSheetName(sheet.sheetName));
  }
  const arrayBuffer = XLSX.write(wb, {
    bookType: "xlsx",
    type: "array",
  }) as ArrayBuffer;
  return new Uint8Array(arrayBuffer);
}

function renderSheet(
  sheet: ExportSheet<unknown>,
  metadata: ExportMetadata | undefined,
): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = {};
  let rowIndex = 0;

  // Metadata block above the table.
  if (metadata) {
    if (metadata.title) {
      writeCell(ws, rowIndex, 0, metadata.title, { bold: true, size: 14 });
      rowIndex += 1;
    }
    if (metadata.filters) {
      for (const [k, v] of Object.entries(metadata.filters)) {
        writeCell(ws, rowIndex, 0, `${k}:`, { bold: true });
        writeCell(ws, rowIndex, 1, v);
        rowIndex += 1;
      }
    }
    if (metadata.generatedBy) {
      writeCell(ws, rowIndex, 0, "Generado por:", { bold: true });
      writeCell(ws, rowIndex, 1, metadata.generatedBy);
      rowIndex += 1;
    }
    if (metadata.generatedAt) {
      writeCell(ws, rowIndex, 0, "Fecha de exportación:", { bold: true });
      writeCell(ws, rowIndex, 1, formatDateTimeForExport(metadata.generatedAt));
      rowIndex += 1;
    }
    // Spacer row between metadata and the table.
    rowIndex += 1;
  }

  // Header row.
  const headerRow = rowIndex;
  sheet.columns.forEach((col, c) => {
    writeCell(ws, headerRow, c, col.label, { bold: true });
  });
  rowIndex += 1;

  // Data rows.
  for (const row of sheet.rows) {
    sheet.columns.forEach((col, c) => {
      const value = getCell(row, col);
      writeFormattedCell(ws, rowIndex, c, value, col.format);
    });
    rowIndex += 1;
  }

  // Sheet bounds.
  const colCount = sheet.columns.length;
  const lastRow = rowIndex - 1;
  ws["!ref"] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: Math.max(lastRow, 0), c: Math.max(colCount - 1, 0) },
  });

  // Column widths (Excel "wch" units).
  ws["!cols"] = sheet.columns.map((col) => ({
    wch: col.width ?? DEFAULT_COL_WIDTH,
  }));

  return ws;
}

function writeCell(
  ws: XLSX.WorkSheet,
  r: number,
  c: number,
  value: string,
  style?: { bold?: boolean; size?: number },
): void {
  const ref = XLSX.utils.encode_cell({ r, c });
  const cell: XLSX.CellObject = {
    v: value,
    t: "s",
  };
  if (style?.bold || style?.size) {
    cell.s = {
      font: {
        ...(style.bold ? { bold: true } : {}),
        ...(style.size ? { sz: style.size } : {}),
      },
    };
  }
  ws[ref] = cell;
}

function writeFormattedCell(
  ws: XLSX.WorkSheet,
  r: number,
  c: number,
  value: unknown,
  format: ExportColumnFormat | undefined,
): void {
  const ref = XLSX.utils.encode_cell({ r, c });
  if (value === null || value === undefined) {
    ws[ref] = { v: "", t: "s" };
    return;
  }
  if (value instanceof Date) {
    ws[ref] = {
      v: value,
      t: "d",
      z: format === "datetime" ? "dd/mm/yyyy hh:mm" : "dd/mm/yyyy",
    };
    return;
  }
  if (typeof value === "number") {
    if (format === "currency-mxn") {
      ws[ref] = { v: value, t: "n", z: `$#,##0.00 "MXN"` };
      return;
    }
    if (format === "currency") {
      ws[ref] = { v: value, t: "n", z: "$#,##0.00" };
      return;
    }
    if (format === "percent") {
      // Value is in 0-100 — display as percent without dividing by 100.
      ws[ref] = { v: value, t: "n", z: `0.0"%"` };
      return;
    }
    ws[ref] = { v: value, t: "n", z: format === "number" ? "0" : undefined };
    return;
  }
  if (typeof value === "boolean") {
    ws[ref] = { v: value, t: "b" };
    return;
  }
  ws[ref] = { v: String(value), t: "s" };
}

function sanitizeSheetName(name: string): string {
  // Excel sheet name rules: max 31 chars, no : \ / ? * [ ]
  return name.replace(/[:\\/?*[\]]/g, "-").slice(0, 31);
}

// ── Helpers ────────────────────────────────────────────────────────────────

function getCell<T>(row: T, col: ExportColumn<T>): unknown {
  if (row === null || typeof row !== "object") return row;
  return (row as Record<string, unknown>)[col.key];
}

function formatDateForExport(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${d}/${m}/${y}`;
}

function formatDateTimeForExport(date: Date): string {
  const base = formatDateForExport(date);
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${base} ${h}:${min}`;
}

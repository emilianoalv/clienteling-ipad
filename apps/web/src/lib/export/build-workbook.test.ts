import * as XLSX from "xlsx";
import { describe, expect, it } from "vitest";
import { buildWorkbookBytes } from "./build-workbook";
import type { ExportColumn } from "./types";

interface Row {
  nombre: string;
  ventas: number;
  porcentaje: number;
  fecha: Date | null;
}

const COLUMNS: ReadonlyArray<ExportColumn<Row>> = [
  { key: "nombre", label: "Nombre" },
  { key: "ventas", label: "Ventas", format: "currency-mxn" },
  { key: "porcentaje", label: "Conv", format: "percent" },
  { key: "fecha", label: "Última transacción", format: "date" },
];

const SAMPLE_ROWS: Row[] = [
  {
    nombre: "Valentina Ríos",
    ventas: 486_200,
    porcentaje: 32.4,
    fecha: new Date(2026, 3, 15),
  },
  {
    nombre: "Iván Núñez",
    ventas: 412_000,
    porcentaje: 28,
    fecha: null,
  },
];

function decode(bytes: Uint8Array): string {
  return new TextDecoder("utf-8").decode(bytes);
}

function readWorkbook(bytes: Uint8Array): XLSX.WorkBook {
  return XLSX.read(bytes, { type: "array" });
}

describe("buildWorkbookBytes · CSV", () => {
  it("emits a UTF-8 BOM so Excel detects encoding correctly", () => {
    const { bytes } = buildWorkbookBytes({
      format: "csv",
      columns: COLUMNS,
      rows: SAMPLE_ROWS,
    });
    expect(bytes[0]).toBe(0xef);
    expect(bytes[1]).toBe(0xbb);
    expect(bytes[2]).toBe(0xbf);
  });

  it("preserves accented characters in body", () => {
    const { bytes } = buildWorkbookBytes({
      format: "csv",
      columns: COLUMNS,
      rows: SAMPLE_ROWS,
    });
    const text = decode(bytes);
    expect(text).toMatch(/Valentina Ríos/);
    expect(text).toMatch(/Iván Núñez/);
  });

  it("formats dates as dd/mm/yyyy and percentages with trailing %", () => {
    const { bytes } = buildWorkbookBytes({
      format: "csv",
      columns: COLUMNS,
      rows: SAMPLE_ROWS,
    });
    const text = decode(bytes);
    expect(text).toMatch(/15\/04\/2026/);
    expect(text).toMatch(/32\.4%/);
  });

  it("escapes commas and quotes correctly", () => {
    const { bytes } = buildWorkbookBytes({
      format: "csv",
      columns: COLUMNS,
      rows: [
        {
          nombre: 'Ana, "VIP"',
          ventas: 1000,
          porcentaje: 12,
          fecha: null,
        },
      ],
    });
    const text = decode(bytes);
    expect(text).toMatch(/"Ana, ""VIP"""/);
  });

  it("sets the CSV mime type", () => {
    const { mimeType } = buildWorkbookBytes({
      format: "csv",
      columns: COLUMNS,
      rows: [],
    });
    expect(mimeType).toBe("text/csv;charset=utf-8");
  });
});

describe("buildWorkbookBytes · XLSX", () => {
  it("writes the data rows into the first sheet", () => {
    const { bytes } = buildWorkbookBytes({
      format: "xlsx",
      sheetName: "Reporte",
      columns: COLUMNS,
      rows: SAMPLE_ROWS,
    });
    const wb = readWorkbook(bytes);
    expect(wb.SheetNames[0]).toBe("Reporte");
    const ws = wb.Sheets["Reporte"]!;
    expect(ws["A1"]?.v).toBe("Nombre");
    expect(ws["A2"]?.v).toBe("Valentina Ríos");
  });

  it("inserts the metadata block above the table", () => {
    const { bytes } = buildWorkbookBytes({
      format: "xlsx",
      sheetName: "Reporte",
      columns: COLUMNS,
      rows: SAMPLE_ROWS,
      metadata: {
        title: "Reporte de prueba",
        filters: { Período: "Abril 2026" },
        generatedBy: "Isa",
        generatedAt: new Date(2026, 4, 24),
      },
    });
    const wb = readWorkbook(bytes);
    const ws = wb.Sheets["Reporte"]!;
    expect(ws["A1"]?.v).toBe("Reporte de prueba");
    let foundAt: number | null = null;
    for (let r = 0; r < 20; r++) {
      const cell = ws[`A${r + 1}`];
      if (cell?.v === "Nombre") {
        foundAt = r + 1;
        break;
      }
    }
    expect(foundAt).not.toBeNull();
    expect(foundAt!).toBeGreaterThan(1);
  });

  it("supports multi-sheet workbooks via the `sheets` shortcut", () => {
    const { bytes, mimeType } = buildWorkbookBytes({
      format: "xlsx",
      sheets: [
        {
          sheetName: "Resumen",
          columns: COLUMNS as ReadonlyArray<ExportColumn<unknown>>,
          rows: SAMPLE_ROWS,
        },
        {
          sheetName: "Detalle",
          columns: COLUMNS as ReadonlyArray<ExportColumn<unknown>>,
          rows: [SAMPLE_ROWS[0]!],
        },
      ],
    });
    const wb = readWorkbook(bytes);
    expect(wb.SheetNames).toEqual(["Resumen", "Detalle"]);
    expect(mimeType).toContain("spreadsheetml.sheet");
  });
});

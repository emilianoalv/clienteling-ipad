import type { Branded } from "./branded";

export type ReportId = Branded<string, "Report">;

export type ReportFormat = "pdf" | "xlsx" | "csv";
export type ReportFrequency = "Diario" | "Semanal" | "Mensual" | "Trimestral" | "Anual";

export interface Report {
  id: ReportId;
  name: string;
  owner: string;
  fmt: ReportFormat;
  freq: ReportFrequency;
  /** ISO date (yyyy-mm-dd) of the last run. */
  lastRun: string;
}

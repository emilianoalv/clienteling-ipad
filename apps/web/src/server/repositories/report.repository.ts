import "server-only";
import type { Report, ReportId } from "@/types/report";

const SEED: Report[] = [
  {
    id: "rp-01" as ReportId,
    name: "Desempeño BA · mensual",
    owner: "Supervisor",
    fmt: "xlsx",
    freq: "Mensual",
    lastRun: "2026-04-20",
  },
  {
    id: "rp-02" as ReportId,
    name: "Funnel de clienteling",
    owner: "Admin CRM",
    fmt: "pdf",
    freq: "Semanal",
    lastRun: "2026-04-21",
  },
  {
    id: "rp-03" as ReportId,
    name: "Cobertura y turnos",
    owner: "Supervisor",
    fmt: "xlsx",
    freq: "Semanal",
    lastRun: "2026-04-20",
  },
  {
    id: "rp-04" as ReportId,
    name: "Consentimientos por canal",
    owner: "Admin CRM",
    fmt: "xlsx",
    freq: "Mensual",
    lastRun: "2026-04-01",
  },
  {
    id: "rp-05" as ReportId,
    name: "Recomendación → conversión",
    owner: "Admin Mkt",
    fmt: "pdf",
    freq: "Mensual",
    lastRun: "2026-04-15",
  },
  {
    id: "rp-06" as ReportId,
    name: "Muestras por SKU",
    owner: "Admin Mkt",
    fmt: "xlsx",
    freq: "Mensual",
    lastRun: "2026-04-15",
  },
  {
    id: "rp-07" as ReportId,
    name: "Inventario crítico (marketing)",
    owner: "Admin Ops",
    fmt: "xlsx",
    freq: "Diario",
    lastRun: "2026-04-23",
  },
  {
    id: "rp-08" as ReportId,
    name: "Panorama regional ejecutivo",
    owner: "Admin HQ",
    fmt: "pdf",
    freq: "Trimestral",
    lastRun: "2026-04-10",
  },
];

const REPORTS = new Map<ReportId, Report>(SEED.map((r) => [r.id, r]));

export interface ReportRepository {
  list(): Promise<Report[]>;
  findById(id: ReportId): Promise<Report | null>;
}

export const reportRepository: ReportRepository = {
  async list() {
    return Array.from(REPORTS.values());
  },
  async findById(id) {
    return REPORTS.get(id) ?? null;
  },
};

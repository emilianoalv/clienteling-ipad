import "server-only";
import type { Report } from "@/types/report";
import { reportRepository } from "@/server/repositories/report.repository";

export async function listReports(): Promise<Report[]> {
  return reportRepository.list();
}

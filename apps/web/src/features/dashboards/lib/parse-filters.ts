import type { BrandId } from "@/types/brand";
import type { StaffId } from "@/types/staff";
import type { StoreId } from "@/types/store";
import { nextNDays, thisMonth } from "../server/utils/date-ranges";
import type { DashboardFilters, DashboardPeriod } from "../server/types";

export type ParsedPeriod = "mtd" | "last-month" | "qtd" | "ytd";

export interface ParseFiltersOptions {
  defaultPeriod?: ParsedPeriod;
  now?: Date;
}

export interface ParsedSearchParams {
  period?: string;
  storeId?: string;
  brand?: string;
  baId?: string;
}

const VALID_PERIODS: ReadonlySet<string> = new Set([
  "mtd",
  "last-month",
  "qtd",
  "ytd",
]);

const VALID_BRANDS: ReadonlySet<string> = new Set(["Lancôme", "YSL"]);

/**
 * Parse the URL searchParams into `DashboardFilters` for the server queries.
 *
 * Unknown / missing values fall back to `defaultPeriod` and undefined scope
 * (= no override). `period.from/to` is half-open `[from, to)` to match the
 * query convention in `server/utils/date-ranges.ts`.
 */
export function parseFilters(
  params: ParsedSearchParams,
  options: ParseFiltersOptions = {},
): DashboardFilters {
  const now = options.now ?? new Date();
  const periodKey: ParsedPeriod = isParsedPeriod(params.period)
    ? params.period
    : (options.defaultPeriod ?? "mtd");

  const period = periodFor(periodKey, now);

  const filters: DashboardFilters = { period };

  if (params.storeId) {
    filters.storeIds = [params.storeId as StoreId];
  }
  if (params.brand && VALID_BRANDS.has(params.brand)) {
    filters.brands = [params.brand as BrandId];
  }
  if (params.baId) {
    filters.baId = params.baId as StaffId;
  }

  return filters;
}

function isParsedPeriod(value: unknown): value is ParsedPeriod {
  return typeof value === "string" && VALID_PERIODS.has(value);
}

function periodFor(key: ParsedPeriod, now: Date): DashboardPeriod {
  switch (key) {
    case "mtd":
      return thisMonth(now);
    case "last-month":
      return lastCalendarMonth(now);
    case "qtd":
      return quarterToDate(now);
    case "ytd":
      return yearToDate(now);
  }
}

function lastCalendarMonth(now: Date): DashboardPeriod {
  // [first day of previous month, first day of current month)
  const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const to = new Date(now.getFullYear(), now.getMonth(), 1);
  return { from, to };
}

function quarterToDate(now: Date): DashboardPeriod {
  const month = now.getMonth();
  const quarterStartMonth = month - (month % 3);
  const from = new Date(now.getFullYear(), quarterStartMonth, 1);
  // Half-open: end exclusive at start of next quarter.
  const to = new Date(now.getFullYear(), quarterStartMonth + 3, 1);
  return { from, to };
}

function yearToDate(now: Date): DashboardPeriod {
  const from = new Date(now.getFullYear(), 0, 1);
  const to = new Date(now.getFullYear() + 1, 0, 1);
  return { from, to };
}

// Re-export for callers that want to know the look-ahead window for
// upcoming-events queries (kept here so all "what is now+30d" lives in one
// place).
export function eventsLookAhead(now: Date = new Date()): DashboardPeriod {
  return nextNDays(30, now);
}

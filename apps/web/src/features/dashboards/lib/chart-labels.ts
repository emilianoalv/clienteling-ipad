import { formatDayMonth, formatDayOnly } from "@/lib/format/date";
import type { SparklineBucket } from "../server/queries";

const MX_LOCALE = "es-MX";

/**
 * Build a decimated x-axis label series for a chart driven by `getSparklineData`.
 *
 * Rules:
 *   - At most ~8 labels visible (step = ceil(N / 8)).
 *   - Within a single month: just the day number ("15", "20"). The month
 *     name belongs in the chart title.
 *   - Across months: print the full "1 jun" when the month changes; bare
 *     day otherwise.
 *   - The first and last buckets are always labelled.
 *   - Hidden positions get `""` so the underlying chart preserves column
 *     spacing (the `<LineChart>` skips rendering empty spans).
 */
export function buildXAxisLabels(
  buckets: readonly SparklineBucket[],
): readonly string[] {
  if (buckets.length === 0) return [];

  const firstMonth = buckets[0]!.date.getMonth();
  const lastMonth = buckets[buckets.length - 1]!.date.getMonth();
  const crossesMonths = firstMonth !== lastMonth;
  const step = Math.max(1, Math.ceil(buckets.length / 8));

  return buckets.map((b, i) => {
    const isLast = i === buckets.length - 1;
    const isVisible = i % step === 0 || isLast;
    if (!isVisible) return "";

    if (!crossesMonths) return formatDayOnly(b.date);

    const prevMonth = i > 0 ? buckets[i - 1]!.date.getMonth() : -1;
    const monthChanged = b.date.getMonth() !== prevMonth;
    if (i === 0 || monthChanged) return formatDayMonth(b.date);
    return formatDayOnly(b.date);
  });
}

/**
 * Title centred below the chart: "Mayo 2026" when single month,
 * "Abril – Junio 2026" when the range crosses months in the same year,
 * "Diciembre 2025 – Enero 2026" when it also crosses years.
 */
export function formatPeriodTitle(
  buckets: readonly SparklineBucket[],
): string {
  if (buckets.length === 0) return "";

  const first = buckets[0]!.date;
  const last = buckets[buckets.length - 1]!.date;
  const sameMonth =
    first.getMonth() === last.getMonth() &&
    first.getFullYear() === last.getFullYear();

  const monthYear = (d: Date) =>
    capitalize(
      new Intl.DateTimeFormat(MX_LOCALE, {
        month: "long",
        year: "numeric",
      }).format(d),
    );

  if (sameMonth) return monthYear(first);

  if (first.getFullYear() === last.getFullYear()) {
    const monthOnly = (d: Date) =>
      capitalize(
        new Intl.DateTimeFormat(MX_LOCALE, { month: "long" }).format(d),
      );
    return `${monthOnly(first)} – ${monthOnly(last)} ${last.getFullYear()}`;
  }

  return `${monthYear(first)} – ${monthYear(last)}`;
}

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

import { endOfMonth, startOfDay, startOfMonth } from "@/lib/date/week";
import {
  formatCurrencyCompact,
  formatPercentChange,
} from "@/lib/format/number";

export interface PacingInput {
  salesAmount: number;
  monthlyTarget: number;
  /** The dashboard period — used to count elapsed days inside MTD. */
  period: { from: Date; to: Date };
  now?: Date;
}

export interface PacingResult {
  /** Display text for the hero ("Vas adelantado por…" / "Estás por debajo…"). */
  text: string;
  /** End-of-month projection at current pace, in MXN. */
  projection: number;
  /** projection / target. Useful for tone (≥1 ahead, <1 behind). */
  ratio: number;
  /** True when the BA has no target wired (skip pacing UI). */
  noTarget: boolean;
}

/**
 * Compute monthly pacing for a BA's hero card. Returns a short Spanish
 * sentence + the underlying projection in MXN so the caller can pick a tone.
 *
 * Algorithm (spec §3.1 — Pacing text formula):
 *
 *   daysInMonth        = endOfMonth - startOfMonth + 1
 *   daysElapsed        = max(1, today - startOfMonth + 1)
 *   ritmoActualDiario  = salesAmount / daysElapsed
 *   proyeccionFinDeMes = ritmoActualDiario * daysInMonth
 *   ritmoNecesario     = (target - salesAmount) / max(1, diasRestantes)
 *
 * `now` defaults to "real now" — pass an explicit value in tests.
 */
export function computePacing(input: PacingInput): PacingResult {
  if (input.monthlyTarget <= 0) {
    return { text: "", projection: 0, ratio: 0, noTarget: true };
  }

  const now = input.now ?? new Date();
  const today = startOfDay(now);
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const daysInMonth = dayDiff(monthStart, monthEnd) + 1;
  const daysElapsed = Math.max(1, dayDiff(monthStart, today) + 1);
  const daysRemaining = Math.max(1, daysInMonth - daysElapsed);

  const dailyPace = input.salesAmount / daysElapsed;
  const projection = Math.round(dailyPace * daysInMonth);
  const ratio = projection / input.monthlyTarget;

  if (projection >= input.monthlyTarget) {
    const ahead = projection - input.monthlyTarget;
    const overPct = ((projection - input.monthlyTarget) / input.monthlyTarget) * 100;
    return {
      text: `Vas adelantado por ${formatCurrencyCompact(ahead)} · proyección ${formatCurrencyCompact(projection)} (${formatPercentChange(overPct)} sobre meta)`,
      projection,
      ratio,
      noTarget: false,
    };
  }

  const shortBy = input.monthlyTarget - projection;
  const dailyNeeded = Math.round((input.monthlyTarget - input.salesAmount) / daysRemaining);
  return {
    text: `Estás ${formatCurrencyCompact(shortBy)} por debajo del ritmo · necesitas ${formatCurrencyCompact(dailyNeeded)}/día los próximos ${daysRemaining} días`,
    projection,
    ratio,
    noTarget: false,
  };
}

function dayDiff(a: Date, b: Date): number {
  return Math.round(
    (startOfDay(b).getTime() - startOfDay(a).getTime()) / 86_400_000,
  );
}

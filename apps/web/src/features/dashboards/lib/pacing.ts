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

// ── Forecast with simulation (Gerente/Supervisor) ───────────────────────────

export interface ForecastSimulationInput {
  salesAmount: number;
  monthlyTarget: number;
  period: { from: Date; to: Date };
  now?: Date;
  /**
   * If provided, simulate the upside of the worst-performing BA recovering
   * to the team average. `deficit` is the extra sales the team would book if
   * that BA hit the average — usually `(teamAverage - worstSales)` for the
   * period.
   */
  worstPerformer?: {
    name: string;
    deficit: number;
  };
}

export interface ForecastSimulationResult {
  /** Display text combining base projection + optional simulation line. */
  text: string;
  projection: number;
  simulatedProjection?: number;
  noTarget: boolean;
}

/**
 * Same algorithm as `computePacing`, but extended with an optional
 * "what-if the worst BA recovers" scenario. Returns a 1-2 line text and
 * both projections so the UI can color the second line in green when the
 * scenario would push the team over target.
 */
export function computeForecastWithSimulation(
  input: ForecastSimulationInput,
): ForecastSimulationResult {
  const base = computePacing(input);
  if (base.noTarget) {
    return { text: "", projection: 0, noTarget: true };
  }

  const lines: string[] = [base.text];

  let simulatedProjection: number | undefined;
  if (input.worstPerformer && input.worstPerformer.deficit > 0) {
    simulatedProjection = base.projection + input.worstPerformer.deficit;
    const overPct =
      ((simulatedProjection - input.monthlyTarget) / input.monthlyTarget) * 100;
    lines.push(
      `proyección si ${input.worstPerformer.name} recupera: ${compact(simulatedProjection)} (${formatPercentChange(overPct)} sobre meta)`,
    );
  }

  return {
    text: lines.join(" · "),
    projection: base.projection,
    simulatedProjection,
    noTarget: false,
  };
}

function compact(n: number): string {
  return formatCurrencyCompact(n);
}

import { describe, expect, it } from "vitest";
import { getAverageTicket } from "./get-average-ticket";
import { getPeriodDelta } from "./get-period-delta";
import { getSalesAmount } from "./get-sales-amount";
import { getTransactionsCount } from "./get-transactions-count";
import {
  admin,
  aprilPeriod,
  baLcmPol,
  baYslPol,
  emptyPeriod,
} from "./_test-fixtures";

// aprilPeriod = [abr-1, may-1), duration 30 days.
// comparablePreviousPeriod → [mar-2, abr-1).
// Purchases en [mar-2, abr-1):
//   pu-2  cl-constanza  POL YSL mar-12  8,900
//   pu-4  cl-adriana    POL YSL mar-18  8,900
//   pu-6  cl-elena      PER LCM mar-10  6,400
//   pu-22 cl-vanessa    POL YSL mar-22  2,650
//   → previous Admin sales = 26,850; transactions = 4; avgTicket = 6,712.5

describe("getPeriodDelta", () => {
  it("sales Admin abril vs marzo: 125,980 vs 26,850 → +99,130 / +369.2%", async () => {
    const d = await getPeriodDelta(
      admin,
      { period: aprilPeriod },
      getSalesAmount,
    );
    expect(d.current).toBe(125_980);
    expect(d.previous).toBe(26_850);
    expect(d.deltaAbs).toBe(99_130);
    expect(d.deltaPct).toBe(369.2);
  });

  it("transactions Admin: 18 vs 4 → +14 / +350.0%", async () => {
    const d = await getPeriodDelta(
      admin,
      { period: aprilPeriod },
      getTransactionsCount,
    );
    expect(d.current).toBe(18);
    expect(d.previous).toBe(4);
    expect(d.deltaPct).toBe(350);
  });

  it("avgTicket Admin: 6,998.89 vs 6,712.5 → +4.3%", async () => {
    const d = await getPeriodDelta(
      admin,
      { period: aprilPeriod },
      getAverageTicket,
    );
    expect(d.current).toBeCloseTo(125_980 / 18);
    expect(d.previous).toBeCloseTo(26_850 / 4, 5);
    expect(d.deltaPct).toBe(4.3);
  });

  it("previous === 0 → deltaPct = 0 (sin Infinity ni NaN)", async () => {
    // BA Lancôme Polanco abril: POL × LCM 40,500.
    // POL × LCM en [mar-2, abr-1): 0.
    const d = await getPeriodDelta(
      baLcmPol,
      { period: aprilPeriod },
      getSalesAmount,
    );
    expect(d.previous).toBe(0);
    expect(d.current).toBe(40_500);
    expect(d.deltaPct).toBe(0);
  });

  it("current vs previous > 0 → ratio correcto", async () => {
    // BA YSL Polanco abril: pu-21 = 5,110.
    // POL × YSL en [mar-2, abr-1): pu-2 + pu-4 + pu-22 = 20,450.
    const d = await getPeriodDelta(
      baYslPol,
      { period: aprilPeriod },
      getSalesAmount,
    );
    expect(d.current).toBe(5_110);
    expect(d.previous).toBe(20_450);
    // (5110 - 20450) / 20450 * 100 = -75.01... → -75.0
    expect(d.deltaPct).toBe(-75);
  });

  it("ambos 0 → deltaAbs 0, deltaPct 0", async () => {
    const d = await getPeriodDelta(
      admin,
      { period: emptyPeriod },
      getSalesAmount,
    );
    expect(d.current).toBe(0);
    expect(d.previous).toBe(0);
    expect(d.deltaAbs).toBe(0);
    expect(d.deltaPct).toBe(0);
  });

  it("respeta el scope vía la metricFn (BA Lancôme Polanco)", async () => {
    // El scope se aplica DENTRO de cada llamada a metricFn. Verifica que
    // current y previous ambos respetan el scope de Valentina (POL × LCM).
    const d = await getPeriodDelta(
      baLcmPol,
      { period: aprilPeriod },
      getTransactionsCount,
    );
    expect(d.current).toBe(4); // pu-1 + pu-3 + pu-20 + pu-23
    expect(d.previous).toBe(0); // sin POL × LCM en marzo
  });
});

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
//   pu-2 cl-constanza POL YSL mar-12 8,900
//   pu-4 cl-adriana   POL YSL mar-18 8,900
//   pu-6 cl-elena     PER LCM mar-10 6,400
//   → previous Admin sales = 24,200; transactions = 3; avgTicket = 8,066.67

describe("getPeriodDelta", () => {
  it("sales Admin abril vs marzo: 80,010 vs 24,200 → +55,810 / +230.6%", async () => {
    const d = await getPeriodDelta(
      admin,
      { period: aprilPeriod },
      getSalesAmount,
    );
    expect(d.current).toBe(80_010);
    expect(d.previous).toBe(24_200);
    expect(d.deltaAbs).toBe(55_810);
    expect(d.deltaPct).toBe(230.6);
  });

  it("transactions Admin: 9 vs 3 → +6 / +200.0%", async () => {
    const d = await getPeriodDelta(
      admin,
      { period: aprilPeriod },
      getTransactionsCount,
    );
    expect(d.current).toBe(9);
    expect(d.previous).toBe(3);
    expect(d.deltaPct).toBe(200);
  });

  it("avgTicket Admin: 8,890 vs 8,066.667 → +10.2%", async () => {
    const d = await getPeriodDelta(
      admin,
      { period: aprilPeriod },
      getAverageTicket,
    );
    expect(d.current).toBe(8_890);
    expect(d.previous).toBeCloseTo(24_200 / 3, 5);
    expect(d.deltaPct).toBe(10.2);
  });

  it("previous === 0 → deltaPct = 0 (sin Infinity ni NaN)", async () => {
    // BA Lancôme Polanco abril: 28,300. POL × LCM en [mar-2, abr-1): 0.
    const d = await getPeriodDelta(
      baLcmPol,
      { period: aprilPeriod },
      getSalesAmount,
    );
    expect(d.previous).toBe(0);
    expect(d.current).toBe(28_300);
    expect(d.deltaPct).toBe(0);
  });

  it("current === 0, previous > 0 → deltaPct = -100.0", async () => {
    // BA YSL Polanco abril: 0. POL × YSL en [mar-2, abr-1): pu-2 + pu-4 = 17,800.
    const d = await getPeriodDelta(
      baYslPol,
      { period: aprilPeriod },
      getSalesAmount,
    );
    expect(d.current).toBe(0);
    expect(d.previous).toBe(17_800);
    expect(d.deltaPct).toBe(-100);
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
    // current y previous ambos respetan el scope de Valentina.
    const d = await getPeriodDelta(
      baLcmPol,
      { period: aprilPeriod },
      getTransactionsCount,
    );
    expect(d.current).toBe(2); // pu-1 + pu-3
    expect(d.previous).toBe(0); // sin POL LCM en marzo
  });
});

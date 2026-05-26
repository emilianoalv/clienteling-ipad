import { describe, expect, it } from "vitest";
import { _internal, getSparklineData } from "./get-sparkline-data";
import {
  admin,
  aprilPeriod,
  baLcmPol,
  baYslPol,
  emptyPeriod,
  ST_PER,
  supervisorCentro,
} from "./_test-fixtures";

const wide60 = {
  from: new Date("2026-03-01T00:00:00.000Z"),
  to: new Date("2026-05-01T00:00:00.000Z"), // 61 days
};

const wide120 = {
  from: new Date("2026-01-01T00:00:00.000Z"),
  to: new Date("2026-05-01T00:00:00.000Z"), // 120 days
};

describe("getSparklineData — granularity auto", () => {
  it("≤31 días → day", () => {
    expect(_internal.autoGranularity(aprilPeriod)).toBe("day");
  });

  it("32–90 días → week", () => {
    expect(_internal.autoGranularity(wide60)).toBe("week");
  });

  it(">90 días → month", () => {
    expect(_internal.autoGranularity(wide120)).toBe("month");
  });
});

describe("getSparklineData — sales (default)", () => {
  it("Admin abril (30 days → day): 30 buckets, suma = 125,980", async () => {
    const series = await getSparklineData(admin, { period: aprilPeriod });
    expect(series).toHaveLength(30);
    expect(series.reduce((s, b) => s + b.value, 0)).toBe(125_980);
    // index 1 = abr-2 = pu-3 12,100 + pu-23 3,250 = 15,350
    expect(series[1]!.value).toBe(15_350);
    // index 20 = abr-21 = pu-1 16,200
    expect(series[20]!.value).toBe(16_200);
    // Bucket without sales (abr-1) → 0
    expect(series[0]!.value).toBe(0);
  });

  it("BA Lancôme Polanco abril: suma = 40,500", async () => {
    const series = await getSparklineData(baLcmPol, { period: aprilPeriod });
    expect(series.reduce((s, b) => s + b.value, 0)).toBe(40_500);
  });

  it("Supervisor Centro abril (excluye Perisur): suma = 94,720", async () => {
    const series = await getSparklineData(supervisorCentro, { period: aprilPeriod });
    expect(series.reduce((s, b) => s + b.value, 0)).toBe(94_720);
  });
});

describe("getSparklineData — granularity week", () => {
  it("período 60 días → 9 buckets semanales", async () => {
    const series = await getSparklineData(admin, { period: wide60 });
    expect(series).toHaveLength(9);
    // primer bucket date = period.from
    expect(series[0]!.date.toISOString()).toBe(wide60.from.toISOString());
  });
});

describe("getSparklineData — métricas alternas", () => {
  it("transactions: suma = 18 (todas las compras de abril)", async () => {
    const series = await getSparklineData(
      admin,
      { period: aprilPeriod },
      { metric: "transactions" },
    );
    expect(series.reduce((s, b) => s + b.value, 0)).toBe(18);
  });

  it("newClients: ninguna alta en abril → suma = 0", async () => {
    const series = await getSparklineData(
      admin,
      { period: aprilPeriod },
      { metric: "newClients" },
    );
    expect(series).toHaveLength(30);
    expect(series.reduce((s, b) => s + b.value, 0)).toBe(0);
  });

  it("followUps: ft-06/07/08 done en abril → suma = 3", async () => {
    const series = await getSparklineData(
      admin,
      { period: aprilPeriod },
      { metric: "followUps" },
    );
    expect(series.reduce((s, b) => s + b.value, 0)).toBe(3);
    // ft-06 abr-15 → index 14
    expect(series[14]!.value).toBe(1);
    // ft-07 abr-22 → index 21
    expect(series[21]!.value).toBe(1);
    // ft-08 abr-30 → index 29
    expect(series[29]!.value).toBe(1);
  });
});

describe("getSparklineData — buckets vacíos y bordes", () => {
  it("período sin datos: todos los buckets con value 0", async () => {
    const series = await getSparklineData(admin, { period: emptyPeriod });
    expect(series.length).toBeGreaterThan(0);
    expect(series.every((b) => b.value === 0)).toBe(true);
  });

  it("scope merge vacío: buckets con value 0 (no se llama al repo)", async () => {
    const series = await getSparklineData(baLcmPol, {
      period: aprilPeriod,
      brands: ["YSL"], // intersección vacía
    });
    expect(series).toHaveLength(30);
    expect(series.every((b) => b.value === 0)).toBe(true);
  });

  it("granularidad explícita anula auto", async () => {
    const series = await getSparklineData(
      admin,
      { period: aprilPeriod },
      { granularity: "week" },
    );
    // 30 días → 5 buckets de 7 días (último parcial 2 días)
    expect(series).toHaveLength(5);
    expect(series.reduce((s, b) => s + b.value, 0)).toBe(125_980);
  });

  it("BA YSL Polanco abril sales: pu-21 = 5,110", async () => {
    const series = await getSparklineData(baYslPol, { period: aprilPeriod });
    expect(series.reduce((s, b) => s + b.value, 0)).toBe(5_110);
  });

  it("Admin filtrando por st-per: suma PER abril = 31,260", async () => {
    const series = await getSparklineData(admin, {
      period: aprilPeriod,
      storeIds: [ST_PER],
    });
    // PER abril: pu-5 9,800 + pu-7 3,800 + pu-18 3,220 + pu-25 8,770
    //           + pu-26 1,550 + pu-27 4,120 = 31,260
    expect(series.reduce((s, b) => s + b.value, 0)).toBe(31_260);
  });
});

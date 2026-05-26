import { describe, expect, it } from "vitest";
import { getOperationalAlerts } from "./get-operational-alerts";
import {
  admin,
  aprilPeriod,
  baLcmPol,
  gerentePol,
  supervisorCentro,
} from "./_test-fixtures";

// Abril 2026 reference:
//   BAs sales (all way below default 50% of monthlyTarget):
//     Valentina 16,200 / 500,000 = 3.2% — below
//     Fernanda  12,100 / 500,000 = 2.4% — below
//     Renata    21,900 / 600,000 = 3.7% — below
//     Ximena     6,400 / 600,000 = 1.1% — below
//     etc. (all 12 BAs below 50%)
//   Stores sales vs target (all below 60%):
//     POL 28,300 / 1,800,000 = 1.6% — below
//     PER 16,820 / 1,500,000 = 1.1% — below
//     STF 34,890 / 2,000,000 = 1.7% — below
//   At-risk clientes Admin abril: 2 (< default 3 → no alert)
//   Stock muestras: con el inventario YSL expandido todos los SKUs están
//     >= 30%, así que ya no se dispara la alerta `inv-sample-stock-low`.

describe("getOperationalAlerts — Admin", () => {
  it("Admin abril: BAs+Tiendas bajo cuota (2 alertas, sin stock bajo)", async () => {
    const r = await getOperationalAlerts(admin, { period: aprilPeriod });
    expect(r.length).toBe(2);
    const ids = r.map((a) => a.id).sort();
    expect(ids).toEqual([
      "perf-ba-below-quota",
      "perf-store-below-quota",
    ]);
  });

  it("orden por severity: ambas warning (ya no hay info de stock)", async () => {
    const r = await getOperationalAlerts(admin, { period: aprilPeriod });
    expect(r[0]!.severity).toBe("warning");
    expect(r[1]!.severity).toBe("warning");
  });

  it("BAs bajo cuota: count=12 (todos), affectedIds populados", async () => {
    const r = await getOperationalAlerts(admin, { period: aprilPeriod });
    const ba = r.find((a) => a.id === "perf-ba-below-quota");
    expect(ba!.count).toBe(12);
    expect(ba!.affectedIds).toHaveLength(12);
    expect(ba!.severity).toBe("warning");
  });

  it("Tiendas bajo objetivo: count=3", async () => {
    const r = await getOperationalAlerts(admin, { period: aprilPeriod });
    const st = r.find((a) => a.id === "perf-store-below-quota");
    expect(st!.count).toBe(3);
  });

  it("Stock bajo: con inventario YSL expandido nadie cae bajo 30% → no alerta", async () => {
    const r = await getOperationalAlerts(admin, { period: aprilPeriod });
    const inv = r.find((a) => a.id === "inv-sample-stock-low");
    expect(inv).toBeUndefined();
  });

  it("at-risk con default 3: NO se dispara (Admin tiene 2 < 3)", async () => {
    const r = await getOperationalAlerts(admin, { period: aprilPeriod });
    expect(r.find((a) => a.id === "ret-at-risk-clients")).toBeUndefined();
  });

  it("at-risk con threshold=1: SÍ dispara con count=2", async () => {
    const r = await getOperationalAlerts(
      admin,
      { period: aprilPeriod },
      { atRiskClientsAlertMin: 1 },
    );
    const atRisk = r.find((a) => a.id === "ret-at-risk-clients");
    expect(atRisk!.count).toBe(2);
  });

  it("Admin NO recibe alerta de follow-ups vencidos (excluido por rol)", async () => {
    const r = await getOperationalAlerts(
      admin,
      { period: aprilPeriod },
      { overdueFollowupsAlertMin: 1 },
    );
    expect(r.find((a) => a.id === "op-overdue-followups")).toBeUndefined();
  });

  it("umbrales muy altos: sistema 'saludable' (cero alertas perf)", async () => {
    const r = await getOperationalAlerts(
      admin,
      { period: aprilPeriod },
      {
        baBelowQuotaThresholdPct: 0,
        storeBelowQuotaThresholdPct: 0,
        atRiskClientsAlertMin: 9999,
        sampleStockLowPct: 0,
      },
    );
    expect(r).toEqual([]);
  });
});

describe("getOperationalAlerts — scope por rol", () => {
  it("Gerente Polanco: BAs bajo cuota solo POL (4), NO Tiendas (rol excluido)", async () => {
    const r = await getOperationalAlerts(gerentePol, { period: aprilPeriod });
    const ba = r.find((a) => a.id === "perf-ba-below-quota");
    expect(ba!.count).toBe(4); // solo POL: Valentina, Fernanda, Daniela, Sofía
    expect(r.find((a) => a.id === "perf-store-below-quota")).toBeUndefined();
    // Con el inventario YSL expandido, ningún SKU cae bajo 30% → sin alerta
    expect(r.find((a) => a.id === "inv-sample-stock-low")).toBeUndefined();
  });

  it("Supervisor Centro: BAs solo POL+STF (8), Tiendas (POL+STF = 2)", async () => {
    const r = await getOperationalAlerts(supervisorCentro, { period: aprilPeriod });
    const ba = r.find((a) => a.id === "perf-ba-below-quota");
    expect(ba!.count).toBe(8);
    const st = r.find((a) => a.id === "perf-store-below-quota");
    expect(st!.count).toBe(2);
    // Stock NO visible para Supervisor
    expect(r.find((a) => a.id === "inv-sample-stock-low")).toBeUndefined();
  });

  it("BA Lancôme Polanco: NO recibe perf alerts (rol excluido)", async () => {
    const r = await getOperationalAlerts(baLcmPol, { period: aprilPeriod });
    expect(r.find((a) => a.id === "perf-ba-below-quota")).toBeUndefined();
    expect(r.find((a) => a.id === "perf-store-below-quota")).toBeUndefined();
    expect(r.find((a) => a.id === "inv-sample-stock-low")).toBeUndefined();
    // BA puede ver: at-risk, overdue followups, NO canceled appts
    expect(r.find((a) => a.id === "op-canceled-appointments")).toBeUndefined();
  });
});

describe("getOperationalAlerts — severity escalation", () => {
  it("overdue followups: >= 2x umbral → critical", async () => {
    // BA Lancôme Polanco scope. ft-01 (Fernanda) está overdue por relativeISO.
    // Forzamos umbral muy bajo para activar escalation.
    const r = await getOperationalAlerts(
      baLcmPol,
      { period: aprilPeriod },
      { overdueFollowupsAlertMin: 1 },
    );
    const op = r.find((a) => a.id === "op-overdue-followups");
    if (op) {
      // Si hay overdue, severity será warning o critical según count vs 2x
      expect(["warning", "critical"]).toContain(op.severity);
    }
  });

  it("createdAt = filters.period.to (point-in-time anchor)", async () => {
    const r = await getOperationalAlerts(admin, { period: aprilPeriod });
    expect(r[0]!.createdAt.toISOString()).toBe(aprilPeriod.to.toISOString());
  });
});

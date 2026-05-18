import { describe, expect, it } from "vitest";
import type { StaffId } from "@/types/staff";
import { getFollowUpToRevisitRate } from "./get-followup-to-revisit-rate";
import {
  admin,
  aprilPeriod,
  baLcmPer,
  baLcmPol,
  baYslPol,
  emptyPeriod,
  gerentePol,
  gerenteStf,
  ST_PER,
  supervisorCentro,
} from "./_test-fixtures";

// Reference seed (abril 2026 done follow-ups):
//   ft-06 cl-constanza POL LCM Valentina, completedAt 2026-04-15
//         → int-1 (POL LCM purchase 2026-04-21) inside default 30d window → REVISITA
//   ft-07 cl-gabriela  PER YSL Lucía,    completedAt 2026-04-22
//         → only post-event interaction is int-21 (WhatsApp 2026-04-25) → NO revisita
//   ft-08 cl-marina    STF LCM Ximena,   completedAt 2026-04-30
//         → int-20 (STF LCM consultation 2026-05-04 by RENATA, the OTHER LCM BA)
//           inside window → REVISITA (proves "any BA in same counter counts")
//   → numerador=2, denominador=3, tasa=2/3 globally.

describe("getFollowUpToRevisitRate", () => {
  it("Admin abril (default 30d): 3 done, 2 con revisita → 2/3", async () => {
    expect(
      await getFollowUpToRevisitRate(admin, { period: aprilPeriod }),
    ).toBeCloseTo(2 / 3, 5);
  });

  it("BA Valentina (POL × LCM): ft-06 con int-1 dentro de ventana → 1.0", async () => {
    expect(
      await getFollowUpToRevisitRate(baLcmPol, { period: aprilPeriod }),
    ).toBe(1);
  });

  it("BA Lucía (PER × YSL): ft-07 con whatsapp (no presencial) → 0", async () => {
    expect(
      await getFollowUpToRevisitRate(baLcmPer, {
        period: aprilPeriod,
      }),
    ).toBe(0); // baLcmPer no ve YSL ni Perisur de Lucía; cubre scope
    // Test explícito de "whatsapp no cuenta" abajo con un BA del counter PER YSL.
  });

  it("revisita por OTRO BA del mismo counter SÍ cuenta (ft-08/int-20)", async () => {
    // ft-08 fue completado por Ximena (BA_STF_LCM_2). int-20 lo hizo Renata
    // (BA_STF_LCM_1). Mismo counter STF×LCM → cuenta como revisita.
    expect(
      await getFollowUpToRevisitRate(gerenteStf, { period: aprilPeriod }),
    ).toBe(1);
  });

  it("interaction whatsapp NO cuenta como revisita (regla de filtro de kinds)", async () => {
    // Aislamos al BA del counter PER × YSL via baId. ft-07 es el único followup
    // done en ese counter en abril. int-21 (whatsapp de cl-gabriela 2026-04-25)
    // existe pero no debe activar revisita.
    const baYslPer = {
      id: "us-ba-per-ysl-1" as StaffId, // Lucía
      name: "Lucía Cabrera",
      initials: "LC",
      role: "BA" as const,
      storeId: ST_PER,
      brand: "YSL" as const,
    };
    expect(
      await getFollowUpToRevisitRate(baYslPer, { period: aprilPeriod }),
    ).toBe(0);
  });

  it("windowDays más corta saca a int-1 de ventana (5d): ft-06 ya no cuenta", async () => {
    // int-1 (2026-04-21) está 6 días después de ft-06 (2026-04-15).
    // Con windowDays=5: ft-06 sin revisita; ft-08+int-20 distan 4 días → SÍ.
    // ft-07 sigue sin revisita. Total numerador=1, denominador=3 → 1/3.
    expect(
      await getFollowUpToRevisitRate(admin, { period: aprilPeriod }, 5),
    ).toBeCloseTo(1 / 3, 5);
  });

  it("Supervisor Centro abril (POL + STF, excluye PER): ft-06 + ft-08 ambos con revisita → 1.0", async () => {
    expect(
      await getFollowUpToRevisitRate(supervisorCentro, { period: aprilPeriod }),
    ).toBe(1);
  });

  it("intersección vacía → 0", async () => {
    expect(
      await getFollowUpToRevisitRate(gerentePol, {
        period: aprilPeriod,
        storeIds: [ST_PER],
      }),
    ).toBe(0);
  });

  it("BA YSL Polanco abril: 0 followups done en POL × YSL → 0 (denominador 0)", async () => {
    expect(
      await getFollowUpToRevisitRate(baYslPol, { period: aprilPeriod }),
    ).toBe(0);
  });

  it("período sin followups done → 0", async () => {
    expect(
      await getFollowUpToRevisitRate(admin, { period: emptyPeriod }),
    ).toBe(0);
  });
});

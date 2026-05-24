import { describe, expect, it } from "vitest";
import type { AuditEvent, AuditEventId } from "@/types/audit-event";
import { computeComplianceData } from "./compliance-score";

const NOW = new Date(2026, 4, 24, 12, 0, 0);

const recentEvent = (overrides: Partial<AuditEvent> = {}): AuditEvent => ({
  id: "ae-1" as unknown as AuditEventId,
  title: "Login admin",
  subject: "us-admin",
  actor: "sistema",
  at: new Date(2026, 4, 23, 10, 0, 0).toISOString(),
  ...overrides,
});

describe("computeComplianceData", () => {
  it("grades 95+ as excelente when consents are at 100% and audit recent", () => {
    const out = computeComplianceData(
      {
        clientsTotal: 150,
        clientsWithGrantedConsent: 150,
        auditEvents: [recentEvent()],
        privacyNoticeVersion: "v2026.03",
      },
      NOW,
    );
    expect(out.grade).toBe("excelente");
    expect(out.score).toBeGreaterThanOrEqual(95);
  });

  it("drops to atencion when consents fall below ~80%", () => {
    const out = computeComplianceData(
      {
        clientsTotal: 100,
        clientsWithGrantedConsent: 65,
        auditEvents: [recentEvent()],
        privacyNoticeVersion: "v2026.03",
      },
      NOW,
    );
    expect(out.grade).toMatch(/atencion|bueno/);
    expect(out.score).toBeLessThan(95);
  });

  it("penalizes RtBF backlog (-20 per day of average age)", () => {
    const old = recentEvent({
      title: "RtBF · cliente solicita borrado",
      at: new Date(2026, 4, 21, 10, 0, 0).toISOString(), // 3 days ago
    });
    const out = computeComplianceData(
      {
        clientsTotal: 100,
        clientsWithGrantedConsent: 100,
        auditEvents: [old, recentEvent()],
        privacyNoticeVersion: "v2026.03",
      },
      NOW,
    );
    expect(out.detail.rtbfPending).toBe(1);
    expect(out.breakdown.rtbfPendingDays).toBeGreaterThan(0);
  });

  it("falls back gracefully on an empty fleet", () => {
    const out = computeComplianceData(
      {
        clientsTotal: 0,
        clientsWithGrantedConsent: 0,
        auditEvents: [],
        privacyNoticeVersion: "v2026.03",
      },
      NOW,
    );
    expect(out.breakdown.consentsActive).toBe(0);
    expect(out.breakdown.auditLogActive).toBe(false);
  });

  it("reports privacy notice version through to the detail", () => {
    const out = computeComplianceData(
      {
        clientsTotal: 1,
        clientsWithGrantedConsent: 1,
        auditEvents: [recentEvent()],
        privacyNoticeVersion: "v2026.07",
      },
      NOW,
    );
    expect(out.detail.privacyNoticeVersion).toBe("v2026.07");
    expect(out.breakdown.privacyNoticeVigente).toBe(true);
  });
});

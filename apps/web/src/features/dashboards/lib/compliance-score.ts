/**
 * LFPDPPP compliance posture for the Admin dashboard (spec §3.4 Sec 5).
 *
 * RFP CA-02 driver. The score is a weighted composite over five signals,
 * each in 0-100:
 *
 *   score = 0.30 * consentsActive    // % of clients with a granted consent
 *         + 0.25 * rtbfScore         // 100 minus 20/day of RtBF backlog
 *         + 0.15 * privacyNotice     // 100 if a vigente notice is on file
 *         + 0.15 * auditLog          // 100 if events landed in ≤7 days
 *         + 0.15 * dataResidency     // 100 — platform-level constraint (MX)
 *
 *   grade = score ≥ 95 → "excelente"
 *         | score ≥ 85 → "bueno"
 *         | score ≥ 70 → "atencion"
 *         | otherwise  → "critico"
 *
 * Several signals are approximated because the prototype's schema doesn't
 * model them fully yet (RtBF queue, privacy-notice versioning). The
 * approximations are documented inline; the contract stays correct so the
 * Admin UI can render a defensible score in the demo.
 */

import type { AuditEvent } from "@/types/audit-event";

export type ComplianceGrade =
  | "excelente"
  | "bueno"
  | "atencion"
  | "critico";

export interface ComplianceBreakdown {
  /** 0-100 — % of clients with at least one granted consent record. */
  consentsActive: number;
  /** Days of RtBF backlog (0 if nothing pending). */
  rtbfPendingDays: number;
  privacyNoticeVigente: boolean;
  auditLogActive: boolean;
  dataResidencyMX: boolean;
}

export interface ComplianceDetail {
  consentsTotal: number;
  consentsWithRecord: number;
  rtbfPending: number;
  privacyNoticeVersion: string;
  auditLogRetentionDays: number;
}

export interface ComplianceData {
  score: number;
  grade: ComplianceGrade;
  breakdown: ComplianceBreakdown;
  detail: ComplianceDetail;
}

export interface ComplianceInput {
  clientsTotal: number;
  /** Number of distinct clients that have at least one `granted` consent. */
  clientsWithGrantedConsent: number;
  auditEvents: readonly AuditEvent[];
  /** Default "v2026.03" — passed through so the UI shows the in-use version. */
  privacyNoticeVersion: string;
}

const DEFAULT_AUDIT_RETENTION_DAYS = 28;
const RECENT_AUDIT_THRESHOLD_DAYS = 7;

export function computeComplianceData(
  input: ComplianceInput,
  now: Date = new Date(),
): ComplianceData {
  const consentsActive =
    input.clientsTotal > 0
      ? clamp((input.clientsWithGrantedConsent / input.clientsTotal) * 100)
      : 0;

  // RtBF (Right to be Forgotten) queue isn't modeled yet. Approximation: scan
  // recent audit events whose title hints at a deletion request. Anything
  // older than 5 days inflates the average backlog age.
  const rtbfCandidates = input.auditEvents.filter((e) =>
    /rtbf|olvido|borr|delete/i.test(e.title),
  );
  const rtbfPending = rtbfCandidates.length;
  const rtbfAvgAgeDays =
    rtbfPending === 0
      ? 0
      : average(
          rtbfCandidates.map(
            (e) =>
              Math.max(
                0,
                (now.getTime() - new Date(e.at).getTime()) / 86_400_000,
              ),
          ),
        );
  const rtbfScore =
    rtbfPending === 0 ? 100 : Math.max(0, 100 - rtbfAvgAgeDays * 20);

  const privacyNoticeVigente = input.privacyNoticeVersion.trim().length > 0;
  const privacyScore = privacyNoticeVigente ? 100 : 70;

  const hasRecentAudit = input.auditEvents.some((e) => {
    const ageDays =
      (now.getTime() - new Date(e.at).getTime()) / 86_400_000;
    return ageDays <= RECENT_AUDIT_THRESHOLD_DAYS;
  });
  const auditScore = hasRecentAudit ? 100 : 50;

  // Data residency: platform-level guarantee. Always 100 unless explicitly
  // overridden in F4 — captured here so future config changes are visible
  // in the score formula instead of being hard-coded at the UI layer.
  const dataResidencyMX = true;
  const residencyScore = 100;

  const score = Math.round(
    0.3 * consentsActive +
      0.25 * rtbfScore +
      0.15 * privacyScore +
      0.15 * auditScore +
      0.15 * residencyScore,
  );

  const grade: ComplianceGrade =
    score >= 95
      ? "excelente"
      : score >= 85
      ? "bueno"
      : score >= 70
      ? "atencion"
      : "critico";

  return {
    score,
    grade,
    breakdown: {
      consentsActive: Math.round(consentsActive),
      rtbfPendingDays: Math.round(rtbfAvgAgeDays),
      privacyNoticeVigente,
      auditLogActive: hasRecentAudit,
      dataResidencyMX,
    },
    detail: {
      consentsTotal: input.clientsTotal,
      consentsWithRecord: input.clientsWithGrantedConsent,
      rtbfPending,
      privacyNoticeVersion: input.privacyNoticeVersion,
      auditLogRetentionDays: DEFAULT_AUDIT_RETENTION_DAYS,
    },
  };
}

function clamp(n: number): number {
  if (Number.isNaN(n)) return 0;
  if (n < 0) return 0;
  if (n > 100) return 100;
  return n;
}

function average(values: readonly number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

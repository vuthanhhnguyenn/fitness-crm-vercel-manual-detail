import { formatDateYYYYMMDD_HHMM } from '@/utils/date.util';
import { addMonths, isAfter } from 'date-fns';

import type {
  GetCrmMembershipApplicationsByIdResponse,
  MembershipApplicationStatus,
} from '@/lib/api/types.gen';

import { STATUS_BADGE_CLASSES, STATUS_LABELS } from '../../_constants/constants';

export type ApplicationDetail = NonNullable<
  GetCrmMembershipApplicationsByIdResponse['application']
>;

export function getStatusLabel(status: MembershipApplicationStatus): string {
  return STATUS_LABELS[status];
}

export function getStatusBadge(status: MembershipApplicationStatus): string {
  return STATUS_BADGE_CLASSES[status];
}

export function formatApplicationDate(value: string | undefined | null): string {
  return formatDateYYYYMMDD_HHMM(value ?? undefined, '—');
}

/** FR-028 — admin-sourced (管理画面) applications must carry an agreement timestamp before approval. */
export function isAgreementMissing(app: ApplicationDetail): boolean {
  return app.application_source === '管理画面' && !app.agreement_datetime;
}

/** Pre-approval checklist warning (never a block) — usage start beyond 2 months of contract start. */
export function isUsageStartWithinTwoMonths(app: ApplicationDetail): boolean {
  const start = new Date(app.contract_start_date);
  const usage = new Date(app.usage_start_date);
  const limit = addMonths(start, 2);
  return !isAfter(usage, limit);
}

export interface ExemptionPreview {
  kind: 'campaign' | 'rejoin' | 'staff' | 'none';
  originalAmount: number;
  discountAmount: number;
  reason: string | null;
  ruleLabel: string | null;
  campaignName: string | null;
  previousWithdrawalDate: string | null;
  rejoinWindowDays: number;
  qualifies: boolean;
}

/**
 * ⚠️ PROVISIONAL (FR-025a) — reproduced from the V0 prototype, absent from C-01
 * revision 260624_v5, pending PO confirmation. Mirrors the server's precedence
 * (campaign → re-enrolment → staff-discretionary, first match wins, never
 * stacking) and additionally lets a not-yet-submitted staff reason preview the
 * discount client-side before the approve mutation persists it. See the same
 * warning at `membership-application.table.ts`'s `resolveEnrollmentFeeExemption`.
 * Do not treat this precedence as a settled requirement.
 */
export function previewExemption(
  serverExemption: ApplicationDetail['enrollment_fee_exemption'],
  localStaffReason: string,
): ExemptionPreview | undefined {
  if (!serverExemption) return undefined;
  if (serverExemption.kind !== 'none') {
    return {
      kind: serverExemption.kind,
      originalAmount: serverExemption.original_amount,
      discountAmount: serverExemption.discount_amount,
      reason: serverExemption.reason,
      ruleLabel: serverExemption.rule_label,
      campaignName: serverExemption.campaign_name,
      previousWithdrawalDate: serverExemption.previous_withdrawal_date,
      rejoinWindowDays: serverExemption.rejoin_window_days,
      qualifies: serverExemption.qualifies,
    };
  }
  const trimmed = localStaffReason.trim();
  if (trimmed.length > 0) {
    return {
      kind: 'staff',
      originalAmount: serverExemption.original_amount,
      discountAmount: serverExemption.original_amount,
      reason: trimmed,
      ruleLabel: serverExemption.rule_label,
      campaignName: serverExemption.campaign_name,
      previousWithdrawalDate: serverExemption.previous_withdrawal_date,
      rejoinWindowDays: serverExemption.rejoin_window_days,
      qualifies: true,
    };
  }
  return {
    kind: 'none',
    originalAmount: serverExemption.original_amount,
    discountAmount: 0,
    reason: null,
    ruleLabel: serverExemption.rule_label,
    campaignName: serverExemption.campaign_name,
    previousWithdrawalDate: serverExemption.previous_withdrawal_date,
    rejoinWindowDays: serverExemption.rejoin_window_days,
    qualifies: false,
  };
}

export const EXEMPTION_KIND_LABELS: Record<ExemptionPreview['kind'], string> = {
  campaign: 'キャンペーン免除',
  rejoin: '再入会者免除',
  staff: 'スタッフ個別免除',
  none: '免除なし',
};

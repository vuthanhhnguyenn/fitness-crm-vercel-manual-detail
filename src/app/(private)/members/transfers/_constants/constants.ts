import { Check, Clock, FileText, type LucideIcon } from 'lucide-react';

import type { StatusTone } from '@/components/common/status-card';

import { TransferBrand, TransferStatus } from '@/lib/api/types.gen';

/**
 * A-02 移籍ステータスの表示メタデータ.
 *
 * Both the list column and the detail screen read this table, so the badge, the dot and the
 * StatusCard tone can never disagree. Statuses come from `types.gen.ts` — never hand-declare a
 * status union (Constitution II). Shape follows `MEMBER_STATUS_CLASSES`
 * (`members/_constants/constants.ts`).
 */
export const TRANSFER_STATUS_LABELS: Record<TransferStatus, string> = {
  [TransferStatus.PENDING]: '申請中',
  [TransferStatus.FROM_STORE_PENDING]: '移籍元承認待ち',
  [TransferStatus.FROM_STORE_APPROVED]: '移籍先承認待ち',
  [TransferStatus.COMPLETED]: '完了',
  [TransferStatus.REJECTED]: '否認',
};

/**
 * Badge classes for the outline status badge. 完了 is intentionally absent — it renders as a
 * plain `secondary` badge with no custom class and no dot (see `shouldShowTransferStatusDot`).
 */
export const TRANSFER_STATUS_CLASSES: Record<TransferStatus, string> = {
  [TransferStatus.PENDING]: 'bg-info/15 text-info border-info/20',
  [TransferStatus.FROM_STORE_PENDING]: 'bg-warning/15 text-warning border-warning/20',
  [TransferStatus.FROM_STORE_APPROVED]: 'bg-warning/15 text-warning border-warning/20',
  [TransferStatus.COMPLETED]: '',
  [TransferStatus.REJECTED]: 'bg-destructive/15 text-destructive border-destructive/20',
};

export const TRANSFER_STATUS_DOT_CLASSES: Record<TransferStatus, string> = {
  [TransferStatus.PENDING]: 'bg-info',
  [TransferStatus.FROM_STORE_PENDING]: 'bg-warning',
  [TransferStatus.FROM_STORE_APPROVED]: 'bg-warning',
  [TransferStatus.COMPLETED]: '',
  [TransferStatus.REJECTED]: 'bg-destructive',
};

/**
 * 完了 is a closed state, so it drops the live-state dot and falls back to a `secondary`
 * badge — matching the V0's status helper.
 */
export function shouldShowTransferStatusDot(status: TransferStatus): boolean {
  return status !== TransferStatus.COMPLETED;
}

export const TRANSFER_STATUS_TONES: Record<TransferStatus, StatusTone> = {
  [TransferStatus.PENDING]: 'info',
  [TransferStatus.FROM_STORE_PENDING]: 'warning',
  [TransferStatus.FROM_STORE_APPROVED]: 'warning',
  [TransferStatus.COMPLETED]: 'muted',
  [TransferStatus.REJECTED]: 'destructive',
};

export const TRANSFER_STATUS_ICONS: Record<TransferStatus, LucideIcon> = {
  [TransferStatus.PENDING]: Clock,
  [TransferStatus.FROM_STORE_PENDING]: Clock,
  [TransferStatus.FROM_STORE_APPROVED]: Clock,
  [TransferStatus.COMPLETED]: Check,
  [TransferStatus.REJECTED]: FileText,
};

/** Statuses at which a decision is still outstanding, so the action area is shown. */
export const TRANSFER_PENDING_STATUSES: readonly TransferStatus[] = [
  TransferStatus.PENDING,
  TransferStatus.FROM_STORE_PENDING,
  TransferStatus.FROM_STORE_APPROVED,
];

export function isTransferPending(status: TransferStatus): boolean {
  return TRANSFER_PENDING_STATUSES.includes(status);
}

// ─── Filter options (V0 order) ────────────────────────────────────────────────

export const ALL_OPTION_VALUE = 'all';

export const TRANSFER_STATUS_OPTIONS = [
  { value: ALL_OPTION_VALUE, label: '全ステータス' },
  ...(Object.keys(TRANSFER_STATUS_LABELS) as TransferStatus[]).map((status) => ({
    value: status,
    label: TRANSFER_STATUS_LABELS[status],
  })),
];

export const TRANSFER_BRAND_LABELS: Record<TransferBrand, string> = {
  [TransferBrand.JOYFIT]: 'JOYFIT',
  [TransferBrand.FIT365]: 'FIT365',
};

export const TRANSFER_BRAND_OPTIONS = [
  { value: ALL_OPTION_VALUE, label: '全ブランド' },
  { value: TransferBrand.JOYFIT, label: 'JOYFIT' },
  { value: TransferBrand.FIT365, label: 'FIT365' },
];

export const TRANSFER_APPLIED_PERIOD_OPTIONS = [
  { value: ALL_OPTION_VALUE, label: '全期間' },
  { value: 'this_month', label: '今月' },
  { value: 'last_month', label: '先月' },
  { value: 'this_year', label: '今年' },
];

export const TRANSFER_AUTO_OPTIONS = [
  { value: ALL_OPTION_VALUE, label: '自動移籍: すべて' },
  { value: 'eligible', label: '自動可のみ' },
  { value: 'excluded', label: '除外あり' },
];

// ─── Approval-flow presentation ───────────────────────────────────────────────

export const TRANSFER_FLOW_BADGE_LABELS: Record<TransferBrand, string> = {
  [TransferBrand.JOYFIT]: '自動移籍',
  [TransferBrand.FIT365]: '手動移籍（2段階承認）',
};

export const TRANSFER_FLOW_NOTES: Record<TransferBrand, string> = {
  [TransferBrand.JOYFIT]:
    'JOYFITの移籍は移籍元店舗の確認・承認後、システムが自動で移籍を実行します。',
  [TransferBrand.FIT365]: 'FIT365の移籍は移籍元・移籍先の両店舗の承認が必要です。',
};

export const APPROVAL_STEP_STORE_TYPE_LABELS: Record<'from' | 'to', string> = {
  from: '移籍元',
  to: '移籍先',
};

// ─── Exclusion presentation ───────────────────────────────────────────────────

export const EXCLUSION_BADGE_LABELS = {
  unpaid: '除外: 未納あり',
  campaign_lock: '除外: 縛り期間中',
} as const;

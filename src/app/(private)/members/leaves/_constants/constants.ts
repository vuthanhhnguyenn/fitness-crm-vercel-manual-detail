import { CheckCircle, Clock, LucideIcon, PauseCircle, Undo2, XCircle } from 'lucide-react';

import { StatusTone } from '@/components/common/status-card';

import { LeaveListStatus, LeaveStatus, LeaveType, ProxyAgreementMethod } from '@/lib/api/types.gen';

/**
 * The four states the A-03 list can show. `completed` (処理完了) is deliberately absent:
 * a completed application leaves the list entirely and survives only on the detail
 * screen (spec Q-10 / FR-010, FR-022).
 */
export const LIST_LEAVE_STATUSES: readonly LeaveListStatus[] = [
  LeaveStatus.SUSPENSION_SCHEDULED,
  LeaveStatus.SUSPENDED,
  LeaveStatus.WITHDRAWAL_SCHEDULED,
  LeaveStatus.WITHDRAWAL_PENDING,
] as const;

/**
 * FR-031 — 200 is not offered: both the mock request schema and the real endpoint
 * cap `limit` at 100, so a 200-row request is rejected outright (research.md §1).
 */
export const LEAVE_PAGE_SIZE_OPTIONS = [25, 50, 100] as const;

// ─── Label Maps ──────────────────────────────────────────────────────────────

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  [LeaveType.SUSPENSION]: '休会',
  [LeaveType.WITHDRAWAL]: '退会',
};

/** FR-065 — the agreement method is stored as an enum and shown in Japanese. */
export const PROXY_AGREEMENT_METHOD_LABELS: Record<ProxyAgreementMethod, string> = {
  [ProxyAgreementMethod.IN_PERSON]: '来店',
  [ProxyAgreementMethod.PHONE]: '電話',
  [ProxyAgreementMethod.EMAIL]: 'メール',
  [ProxyAgreementMethod.LINE]: 'LINE',
};

export const LEAVE_STATUS_LABELS: Record<LeaveStatus, string> = {
  [LeaveStatus.SUSPENSION_SCHEDULED]: '休会予定',
  [LeaveStatus.SUSPENDED]: '休会中',
  [LeaveStatus.WITHDRAWAL_SCHEDULED]: '退会予定',
  [LeaveStatus.WITHDRAWAL_PENDING]: '退会処理待ち',
  [LeaveStatus.COMPLETED]: '処理完了',
  [LeaveStatus.CANCELLED]: '取り消し済み',
};

export const LEAVE_TYPE_CLASSES: Record<LeaveType, string> = {
  [LeaveType.SUSPENSION]: 'bg-info/15 text-info border-info/20',
  [LeaveType.WITHDRAWAL]: 'bg-destructive/15 text-destructive border-destructive/20',
};

export const LEAVE_STATUS_CLASSES: Record<LeaveStatus, { badge: string; dot: string }> = {
  [LeaveStatus.SUSPENSION_SCHEDULED]: {
    badge: 'bg-warning/15 text-warning border-warning/20',
    dot: 'bg-warning',
  },
  [LeaveStatus.SUSPENDED]: {
    badge: 'bg-info/15 text-info border-info/20',
    dot: 'bg-info',
  },
  [LeaveStatus.WITHDRAWAL_SCHEDULED]: {
    badge: 'bg-destructive/15 text-destructive border-destructive/20',
    dot: 'bg-destructive',
  },
  [LeaveStatus.WITHDRAWAL_PENDING]: {
    badge: 'bg-warning/15 text-warning border-warning/20',
    dot: 'bg-warning',
  },
  [LeaveStatus.COMPLETED]: {
    badge: '',
    dot: '',
  },
  [LeaveStatus.CANCELLED]: {
    badge: '',
    dot: '',
  },
};

export const STATUS_ICON_CONFIG: Record<
  LeaveStatus,
  {
    icon: LucideIcon;
    tone: StatusTone;
    label: string;
  }
> = {
  [LeaveStatus.SUSPENSION_SCHEDULED]: {
    icon: Clock,
    tone: 'warning',
    label: LEAVE_STATUS_LABELS[LeaveStatus.SUSPENSION_SCHEDULED],
  },
  [LeaveStatus.SUSPENDED]: {
    icon: PauseCircle,
    tone: 'info',
    label: LEAVE_STATUS_LABELS[LeaveStatus.SUSPENDED],
  },
  [LeaveStatus.WITHDRAWAL_SCHEDULED]: {
    icon: Clock,
    tone: 'destructive',
    label: LEAVE_STATUS_LABELS[LeaveStatus.WITHDRAWAL_SCHEDULED],
  },
  [LeaveStatus.WITHDRAWAL_PENDING]: {
    icon: XCircle,
    tone: 'warning',
    label: LEAVE_STATUS_LABELS[LeaveStatus.WITHDRAWAL_PENDING],
  },
  [LeaveStatus.COMPLETED]: {
    icon: CheckCircle,
    tone: 'muted',
    label: LEAVE_STATUS_LABELS[LeaveStatus.COMPLETED],
  },
  [LeaveStatus.CANCELLED]: {
    icon: Undo2,
    tone: 'muted',
    label: LEAVE_STATUS_LABELS[LeaveStatus.CANCELLED],
  },
};

// ─── Filter Option Lists ──────────────────────────────────────────────────────

export const LEAVE_TYPE_OPTIONS = [
  { value: 'all', label: '全種別' },
  ...Object.values(LeaveType).map((value) => ({
    value,
    label: LEAVE_TYPE_LABELS[value],
  })),
];

/** Built from the list-facing subset, so 処理完了 can never leak into the filter (Q-10). */
export const LEAVE_STATUS_OPTIONS = [
  { value: 'all', label: '全ステータス' },
  ...LIST_LEAVE_STATUSES.map((value) => ({
    value,
    label: LEAVE_STATUS_LABELS[value],
  })),
];

export const SCHEDULED_PERIOD_OPTIONS = [
  { value: 'all', label: '全期間' },
  { value: 'current_month', label: '今月' },
  { value: 'next_month', label: '来月' },
  { value: 'current_year', label: '今年' },
] as const;

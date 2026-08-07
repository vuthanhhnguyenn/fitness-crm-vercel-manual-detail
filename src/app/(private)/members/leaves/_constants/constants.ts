import { CheckCircle, Clock, LucideIcon, PauseCircle, XCircle } from 'lucide-react';

import { StatusTone } from '@/components/common/status-card';

import { LeaveStatus, LeaveType } from '@/lib/api/types.gen';

// ─── Label Maps ──────────────────────────────────────────────────────────────

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  [LeaveType.SUSPENSION]: '休会',
  [LeaveType.WITHDRAWAL]: '退会',
};

export const LEAVE_STATUS_LABELS: Record<LeaveStatus, string> = {
  [LeaveStatus.SUSPENSION_SCHEDULED]: '休会予定',
  [LeaveStatus.SUSPENDED]: '休会中',
  [LeaveStatus.WITHDRAWAL_SCHEDULED]: '退会予定',
  [LeaveStatus.WITHDRAWAL_PENDING]: '退会処理待ち',
  [LeaveStatus.COMPLETED]: '処理完了',
};

export const LEAVE_TYPE_CLASSES: Record<LeaveType, string> = {
  [LeaveType.SUSPENSION]: 'bg-info/15 text-info border-info/20',
  [LeaveType.WITHDRAWAL]: 'bg-destructive/15 text-destructive border-destructive/20',
};

export const LEAVE_STATUS_CLASSES: Record<
  LeaveStatus,
  { badge: string; dot: string; isOutline: boolean }
> = {
  [LeaveStatus.SUSPENSION_SCHEDULED]: {
    badge: 'bg-warning/15 text-warning border-warning/20',
    dot: 'bg-warning',
    isOutline: true,
  },
  [LeaveStatus.SUSPENDED]: {
    badge: 'bg-info/15 text-info border-info/20',
    dot: 'bg-info',
    isOutline: true,
  },
  [LeaveStatus.WITHDRAWAL_SCHEDULED]: {
    badge: 'bg-destructive/15 text-destructive border-destructive/20',
    dot: 'bg-destructive',
    isOutline: true,
  },
  [LeaveStatus.WITHDRAWAL_PENDING]: {
    badge: 'bg-warning/15 text-warning border-warning/20',
    dot: 'bg-warning',
    isOutline: true,
  },
  [LeaveStatus.COMPLETED]: {
    badge: '',
    dot: '',
    isOutline: false,
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
    tone: 'info',
    label: LEAVE_STATUS_LABELS[LeaveStatus.COMPLETED],
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

export const LEAVE_STATUS_OPTIONS = [
  { value: 'all', label: '全ステータス' },
  ...Object.values(LeaveStatus).map((value) => ({
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

import type { GetCrmNotificationsResponse } from '@/lib/api/types.gen';

export type ManualNotificationRow = GetCrmNotificationsResponse['items'][number];
export type ManualNotificationStatus = ManualNotificationRow['status'];
export type ManualNotificationListStatus = ManualNotificationStatus;
export type ManualNotificationChannel = ManualNotificationRow['channels'][number];
export type ManualNotificationTargetType = ManualNotificationRow['target']['type'];

export const MANUAL_NOTIFICATION_STATUS_LABELS: Record<ManualNotificationListStatus, string> = {
  draft: '下書き',
  pending_approval: '承認待ち',
  returned: '差し戻し',
  scheduled: '予約',
  sending: '配信中',
  sent: '配信済',
};

export const MANUAL_NOTIFICATION_STATUS_CLASSES: Record<ManualNotificationListStatus, string> = {
  draft: 'bg-muted text-muted-foreground border-border',
  pending_approval: 'bg-warning/15 text-warning border-warning/20',
  returned: 'bg-destructive/15 text-destructive border-destructive/20',
  scheduled: 'bg-info/15 text-info border-info/20',
  sending: 'bg-success/15 text-success border-success/20',
  sent: 'bg-muted text-foreground border-border',
};

export function getManualNotificationStatusLabel(status: ManualNotificationStatus): string {
  return MANUAL_NOTIFICATION_STATUS_LABELS[status];
}

export function getManualNotificationStatusClass(status: ManualNotificationStatus): string {
  return MANUAL_NOTIFICATION_STATUS_CLASSES[status];
}

export const MANUAL_NOTIFICATION_CHANNEL_LABELS: Record<ManualNotificationChannel, string> = {
  sms: 'SMS',
  push: 'プッシュ',
  email: 'メール',
  in_app: 'アプリ内',
};

export const MANUAL_NOTIFICATION_TARGET_LABELS: Record<ManualNotificationTargetType, string> = {
  all_members: '全会員',
  brands: 'ブランド指定',
  stores: '店舗限定',
  contract_type: '契約種別',
  membership_duration: '入会後期間',
};

export const MANUAL_NOTIFICATION_BRAND_LABELS = {
  joyfit: 'JOYFIT',
  joyfit24: 'JOYFIT24',
  joyfit_yoga: 'JOYFIT YOGA',
  joyfit_plus: 'JOYFIT+',
  fit365: 'FIT365',
} as const;

export const MANUAL_NOTIFICATION_STATUS_OPTIONS = Object.keys(
  MANUAL_NOTIFICATION_STATUS_LABELS,
) as ManualNotificationListStatus[];

export const MANUAL_NOTIFICATION_CHANNEL_OPTIONS = Object.keys(
  MANUAL_NOTIFICATION_CHANNEL_LABELS,
) as ManualNotificationChannel[];

export const MANUAL_NOTIFICATION_TARGET_OPTIONS = Object.keys(
  MANUAL_NOTIFICATION_TARGET_LABELS,
) as ManualNotificationTargetType[];

export const MANUAL_NOTIFICATION_APPROVAL_TARGETS: ManualNotificationTargetType[] = [
  'all_members',
  'brands',
];

export function manualNotificationRequiresApproval(targetType: ManualNotificationTargetType) {
  return MANUAL_NOTIFICATION_APPROVAL_TARGETS.includes(targetType);
}

export interface ManualNotificationActionPolicy {
  canRequestApproval: boolean;
  canSend: boolean;
  canApprove: boolean;
  canReturn: boolean;
  canResubmit: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export function getManualNotificationActionPolicy(
  row: Pick<ManualNotificationRow, 'status' | 'target' | 'requiresApproval'>,
): ManualNotificationActionPolicy {
  return {
    canRequestApproval: row.status === 'draft' && row.requiresApproval,
    canSend: row.status === 'draft' && !row.requiresApproval,
    canApprove: row.status === 'pending_approval',
    canReturn: row.status === 'pending_approval',
    canResubmit: row.status === 'returned',
    canEdit: ['draft', 'returned', 'pending_approval'].includes(row.status),
    canDelete: ['draft', 'returned'].includes(row.status),
  };
}

export const MANUAL_NOTIFICATION_PAGE_SIZE_OPTIONS = [25, 50, 100, 200] as const;

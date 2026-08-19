import type { GetCrmNotificationsResponse } from '@/lib/api/types.gen';

export type ManualNotificationRow = GetCrmNotificationsResponse['items'][number];
type ManualNotificationStatus = ManualNotificationRow['status'];
export type ManualNotificationChannel = ManualNotificationRow['channels'][number];
type ManualNotificationTarget = ManualNotificationRow['target'];
type ManualNotificationTargetType = ManualNotificationTarget['type'];
type ManualNotificationBrand = Extract<
  ManualNotificationTarget,
  { type: 'brands' }
>['brands'][number];
type ManualNotificationDynamicAttribute = Extract<
  ManualNotificationTarget,
  { type: 'dynamic_attribute' }
>['attribute'];
type ManualNotificationContractType = Extract<
  ManualNotificationTarget,
  { type: 'contract_type' }
>['contractType'];
type ManualNotificationMembershipDurationCondition = Extract<
  ManualNotificationTarget,
  { type: 'membership_duration' }
>['condition'];
type ManualNotificationRecurringTiming = Extract<
  ManualNotificationRow['timing'],
  { type: 'recurring' }
>;

export const MANUAL_NOTIFICATION_CHANNEL_OPTIONS = [
  'sms',
  'push',
  'email',
  'in_app',
] as const satisfies readonly ManualNotificationChannel[];

export const MANUAL_NOTIFICATION_TARGET_OPTIONS = [
  'all_members',
  'brands',
  'stores',
  'contract_type',
  'membership_duration',
  'dynamic_attribute',
  'members',
] as const satisfies readonly ManualNotificationTargetType[];

export const MANUAL_NOTIFICATION_BRAND_OPTIONS = [
  'joyfit_all',
  'joyfit',
  'joyfit24',
  'joyfit_yoga',
  'joyfit_plus',
  'fit365',
] as const satisfies readonly ManualNotificationBrand[];

export const MANUAL_NOTIFICATION_STATUS_LABELS: Record<ManualNotificationStatus, string> = {
  draft: '下書き',
  pending_approval: '承認待ち',
  returned: '差し戻し',
  scheduled: '予約',
  sending: '配信中',
  sent: '配信済',
};

export const MANUAL_NOTIFICATION_STATUS_CLASSES: Record<ManualNotificationStatus, string> = {
  draft: 'bg-muted text-muted-foreground border-border',
  pending_approval: 'bg-warning/15 text-warning border-warning/20',
  returned: 'bg-destructive/15 text-destructive border-destructive/20',
  scheduled: 'bg-info/15 text-info border-info/20',
  sending: 'bg-success/15 text-success border-success/20',
  sent: 'bg-muted text-foreground border-border',
};

export const MANUAL_NOTIFICATION_SAVE_SUCCESS_MESSAGES: Record<ManualNotificationStatus, string> = {
  draft: '下書きを保存しました',
  pending_approval: '通知の承認依頼を送信しました',
  returned: '差し戻し中の通知を保存しました',
  scheduled: '通知を予約しました',
  sending: '通知の配信を開始しました',
  sent: '通知を保存しました',
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
  stores: '店舗指定',
  contract_type: '契約種別指定',
  membership_duration: '入会後X月（期間指定）',
  dynamic_attribute: '動的属性指定',
  members: '会員個別指定',
};

export const MANUAL_NOTIFICATION_DYNAMIC_ATTRIBUTE_OPTIONS = [
  { value: 'unpaid', label: '未納者', description: '請求の支払い未完了の会員' },
  { value: 'dormant', label: '休眠会員', description: '直近90日間来館がない会員' },
  {
    value: 'withdrawal_pending',
    label: '退会予定者',
    description: '退会申請受理済み・実施前の会員',
  },
  { value: 'birthday_month', label: '誕生月会員', description: '今月が誕生月の会員' },
  { value: 'trial', label: '体験来館者', description: '見学・体験のみで未入会の会員' },
] as const satisfies ReadonlyArray<{
  value: ManualNotificationDynamicAttribute;
  label: string;
  description: string;
}>;

export const MANUAL_NOTIFICATION_CONTRACT_TYPE_OPTIONS = [
  'regular',
  'premium',
  'visitor',
  'corporate',
] as const satisfies readonly ManualNotificationContractType[];

export const MANUAL_NOTIFICATION_CONTRACT_TYPE_LABELS: Record<
  ManualNotificationContractType,
  string
> = {
  regular: 'レギュラー会員',
  premium: 'プレミアム会員',
  visitor: 'ビジター会員',
  corporate: '法人会員',
};

export const MANUAL_NOTIFICATION_MEMBERSHIP_DURATION_CONDITION_LABELS: Record<
  ManualNotificationMembershipDurationCondition,
  string
> = {
  within: '以内',
  at_least: '以上',
};

export const MANUAL_NOTIFICATION_FREQUENCY_LABELS: Record<
  ManualNotificationRecurringTiming['frequency'],
  string
> = {
  daily: '毎日',
  weekly: '毎週',
  monthly: '毎月',
  custom: 'カスタム',
};

export const MANUAL_NOTIFICATION_INTERVAL_UNIT_LABELS: Record<
  NonNullable<ManualNotificationRecurringTiming['intervalUnit']>,
  string
> = {
  day: '日',
  week: '週',
  month: '月',
};

export function getManualNotificationDynamicAttributeLabel(
  attribute: ManualNotificationDynamicAttribute,
): string {
  return (
    MANUAL_NOTIFICATION_DYNAMIC_ATTRIBUTE_OPTIONS.find((option) => option.value === attribute)
      ?.label ?? attribute
  );
}

export const MANUAL_NOTIFICATION_BRAND_LABELS: Record<ManualNotificationBrand, string> = {
  joyfit_all: 'JOYFIT全体',
  joyfit: 'JOYFIT',
  joyfit24: 'JOYFIT24',
  joyfit_yoga: 'JOYFIT YOGA',
  joyfit_plus: 'JOYFIT+',
  fit365: 'FIT365',
} as const;

export const MANUAL_NOTIFICATION_STATUS_OPTIONS = Object.keys(
  MANUAL_NOTIFICATION_STATUS_LABELS,
) as ManualNotificationStatus[];

export function manualNotificationRequiresApproval(target: {
  type: ManualNotificationTargetType;
  brands?: readonly ManualNotificationBrand[];
}) {
  return target.type !== 'stores' && target.type !== 'members';
}

interface ManualNotificationActionPolicy {
  canRequestApproval: boolean;
  canSend: boolean;
  canApprove: boolean;
  canReturn: boolean;
  canResubmit: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export function getManualNotificationActionPolicy(
  row: Pick<ManualNotificationRow, 'status' | 'requiresApproval'>,
): ManualNotificationActionPolicy {
  return {
    canRequestApproval: row.status === 'draft' && row.requiresApproval,
    canSend: row.status === 'draft' && !row.requiresApproval,
    canApprove: row.status === 'pending_approval' && row.requiresApproval,
    canReturn: row.status === 'pending_approval' && row.requiresApproval,
    canResubmit: row.status === 'returned' && row.requiresApproval,
    canEdit: ['draft', 'returned', 'pending_approval'].includes(row.status),
    canDelete: ['draft', 'returned'].includes(row.status),
  };
}

export const MANUAL_NOTIFICATION_PAGE_SIZE_OPTIONS = [25, 50, 100, 200] as const;

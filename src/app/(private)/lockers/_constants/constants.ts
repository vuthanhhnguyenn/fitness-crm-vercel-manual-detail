import {
  LockerContractStatus,
  LockerLockType,
  LockerOptionType,
  LockerPendingLocation,
  LockerReminderNotificationMethod,
  LockerReminderNotificationStatus,
  LockerShape,
  LockerSlotOpenType,
} from '@/lib/api/types.gen';

export const LOCKER_SHAPE_LABELS: Record<LockerShape, string> = {
  [LockerShape['3X9']]: '3段×9列',
  [LockerShape['3X6']]: '3段×6列',
  [LockerShape['2X10']]: '2段×10列',
  [LockerShape['2X4']]: '2段×4列',
};

export const LOCKER_OPTION_TYPE_LABELS: Record<LockerOptionType, string> = {
  [LockerOptionType.NONE]: 'なし',
  [LockerOptionType.STANDARD]: 'スタンダード',
  [LockerOptionType.PREMIUM]: 'プレミアムロッカー',
};

export const LOCKER_CONTRACT_STATUS_LABELS: Record<LockerContractStatus, string> = {
  [LockerContractStatus.IN_USE]: '利用中',
  [LockerContractStatus.PENDING_RELEASE]: '開放待ち',
  [LockerContractStatus.AVAILABLE]: '利用可能',
};

export const LOCKER_CONTRACT_STATUS_BADGE_CLASSES: Record<LockerContractStatus, string> = {
  [LockerContractStatus.IN_USE]: 'bg-info/15 text-info border-info/20',
  [LockerContractStatus.PENDING_RELEASE]: 'bg-warning/15 text-warning border-warning/20',
  [LockerContractStatus.AVAILABLE]: 'bg-muted text-muted-foreground border-border',
};

export const LOCKER_PENDING_LOCATION_LABELS: Record<LockerPendingLocation, string> = {
  [LockerPendingLocation.A_CHANGING_ROOM]: 'A: 更衣室エリア',
  [LockerPendingLocation.B_GYM_AREA]: 'B: ジムエリア',
  [LockerPendingLocation.C_POOL_SIDE]: 'C: プールサイド',
  [LockerPendingLocation.F_ENTRANCE]: 'F: エントランス',
};

export const LOCKER_LOCK_TYPE_LABELS: Record<LockerLockType, string> = {
  [LockerLockType.DIAL]: 'ダイヤル錠',
  [LockerLockType.CYLINDER]: 'シリンダー錠',
};

export const LOCKER_SLOT_OPEN_TYPE_LABELS: Record<LockerSlotOpenType, string> = {
  [LockerSlotOpenType.DOOR]: '扉型',
  [LockerSlotOpenType.DRAWER]: '引き出し型',
};

export const LOCKER_REMINDER_METHOD_LABELS: Record<LockerReminderNotificationMethod, string> = {
  [LockerReminderNotificationMethod.PUSH]: 'プッシュ通知',
  [LockerReminderNotificationMethod.IN_APP]: 'アプリ内通知',
};

export const LOCKER_REMINDER_STATUS_LABELS: Record<LockerReminderNotificationStatus, string> = {
  [LockerReminderNotificationStatus.UNSENT]: '未送信',
  [LockerReminderNotificationStatus.SENT]: '送信済み',
  [LockerReminderNotificationStatus.FAILED]: '送信失敗',
};

export const LOCKER_REMINDER_STATUS_BADGE_CLASSES: Record<
  LockerReminderNotificationStatus,
  string
> = {
  [LockerReminderNotificationStatus.UNSENT]: 'bg-muted text-muted-foreground border-border',
  [LockerReminderNotificationStatus.SENT]: 'bg-success/15 text-success border-success/20',
  [LockerReminderNotificationStatus.FAILED]:
    'bg-destructive/15 text-destructive border-destructive/20',
};

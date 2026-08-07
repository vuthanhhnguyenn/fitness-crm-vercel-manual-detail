import type {
  ManualNotificationChannel,
  ManualNotificationListItem,
} from '@/app/api/_schemas/manual-notification.schema';

type ManualNotificationDeliveryResult = {
  deliveredAt?: string;
  deliveredCount: number;
  reachedCount?: number;
  openedCount?: number;
  channelResults?: Array<{
    channel: ManualNotificationChannel;
    deliveredCount: number;
    reachedCount?: number;
    openedCount?: number;
  }>;
};

export type ManualNotificationRow = ManualNotificationListItem & {
  createdByUserId: string;
  targetStoreIds: string[];
  createdAt: string;
  deletedAt: string | null;
  messages: Partial<Record<ManualNotificationChannel, string>>;
  approvedBy?: string;
  approvedAt?: string;
  returnReason?: string;
  deliveryResult?: ManualNotificationDeliveryResult;
};

export type ManualNotificationsType = {
  _rows: ManualNotificationRow[];
  _seeded: boolean;
  _seed(): void;
  getList(): ManualNotificationRow[];
  getById(id: string): ManualNotificationRow | undefined;
  updateStatus(
    id: string,
    status: ManualNotificationRow['status'],
  ): ManualNotificationRow | undefined;
  updateAudit(
    id: string,
    audit: Pick<ManualNotificationRow, 'approvedBy' | 'approvedAt' | 'returnReason'>,
  ): ManualNotificationRow | undefined;
  softDelete(id: string): boolean;
};

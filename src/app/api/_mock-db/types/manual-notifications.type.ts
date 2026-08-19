import type {
  ManualNotificationChannel,
  ManualNotificationContents,
  ManualNotificationListItem,
  ManualNotificationTargetInput,
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
  contents: ManualNotificationContents;
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
  estimateTargetCount(target: ManualNotificationTargetInput): number;
  updateStatus(
    id: string,
    status: ManualNotificationRow['status'],
    targetMetadata?: Pick<ManualNotificationRow, 'targetCount' | 'targetStoreIds'>,
  ): ManualNotificationRow | undefined;
  updateAudit(
    id: string,
    audit: Pick<ManualNotificationRow, 'approvedBy' | 'approvedAt' | 'returnReason'>,
  ): ManualNotificationRow | undefined;
  create(input: Omit<ManualNotificationRow, 'id'>): ManualNotificationRow;
  update(id: string, input: Omit<ManualNotificationRow, 'id'>): ManualNotificationRow | undefined;
  softDelete(id: string): boolean;
};

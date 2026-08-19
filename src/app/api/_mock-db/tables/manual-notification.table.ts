import {
  MANUAL_NOTIFICATION_SEED,
  getManualNotificationTargetPreviewCount,
} from '../seeds/manual-notification.seed';
import type { ManualNotificationsType } from '../types';
import type { ManualNotificationRow } from '../types/manual-notifications.type';

function cloneContents(contents: ManualNotificationRow['contents']) {
  return {
    ...(contents.sms ? { sms: { ...contents.sms } } : {}),
    ...(contents.push ? { push: { ...contents.push } } : {}),
    ...(contents.email ? { email: { ...contents.email } } : {}),
    ...(contents.in_app ? { in_app: { ...contents.in_app } } : {}),
  };
}

export function createManualNotificationTable(): { manualNotifications: ManualNotificationsType } {
  return {
    manualNotifications: {
      _rows: [],
      _seeded: false,
      _seed(): void {
        if (this._seeded) return;
        this._seeded = true;
        this._rows = MANUAL_NOTIFICATION_SEED.map((row) => ({
          ...row,
          channels: [...row.channels],
          targetStoreIds: [...row.targetStoreIds],
          contents: cloneContents(row.contents),
          ...(row.deliveryResult
            ? {
                deliveryResult: {
                  ...row.deliveryResult,
                  channelResults: row.deliveryResult.channelResults?.map((result) => ({
                    ...result,
                  })),
                },
              }
            : {}),
        }));
      },
      getList() {
        this._seed();
        return [...this._rows];
      },
      getById(id) {
        this._seed();
        return this._rows.find((row) => row.id === id);
      },
      estimateTargetCount(target) {
        return getManualNotificationTargetPreviewCount(target);
      },
      updateStatus(id, status, targetMetadata) {
        this._seed();
        const row = this._rows.find((item) => item.id === id && item.deletedAt === null);
        if (!row) return undefined;
        row.status = status;
        if (targetMetadata) {
          row.targetCount = targetMetadata.targetCount;
          row.targetStoreIds = [...targetMetadata.targetStoreIds];
        }
        row.updatedAt = new Date().toISOString();
        return row;
      },
      updateAudit(id, audit) {
        this._seed();
        const row = this._rows.find((item) => item.id === id && item.deletedAt === null);
        if (!row) return undefined;
        Object.assign(row, audit);
        row.updatedAt = new Date().toISOString();
        return row;
      },
      create(input) {
        this._seed();
        const nextId = `N-${String(this._rows.length + 1).padStart(3, '0')}`;
        const now = new Date().toISOString();
        const row: ManualNotificationRow = {
          ...input,
          id: nextId,
          createdAt: input.createdAt ?? now,
          updatedAt: now,
          deletedAt: null,
          channels: [...input.channels],
          targetStoreIds: [...input.targetStoreIds],
          contents: cloneContents(input.contents),
        };
        this._rows.push(row);
        return row;
      },
      update(id, input) {
        this._seed();
        const row = this._rows.find((item) => item.id === id && item.deletedAt === null);
        if (!row) return undefined;
        Object.assign(row, input, {
          updatedAt: new Date().toISOString(),
          channels: [...input.channels],
          targetStoreIds: [...input.targetStoreIds],
          contents: cloneContents(input.contents),
        });
        return row;
      },
      softDelete(id) {
        this._seed();
        const row = this._rows.find((item) => item.id === id && item.deletedAt === null);
        if (!row) return false;
        row.deletedAt = new Date().toISOString();
        return true;
      },
    },
  };
}

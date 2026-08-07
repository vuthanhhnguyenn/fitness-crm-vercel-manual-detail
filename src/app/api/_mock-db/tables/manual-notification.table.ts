import { MANUAL_NOTIFICATION_SEED } from '../seeds/manual-notification.seed';
import type { ManualNotificationsType } from '../types';

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
          messages: { ...row.messages },
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
      updateStatus(id, status) {
        this._seed();
        const row = this._rows.find((item) => item.id === id && item.deletedAt === null);
        if (!row) return undefined;
        row.status = status;
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

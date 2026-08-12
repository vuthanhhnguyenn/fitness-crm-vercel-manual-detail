import { MANUAL_NOTIFICATION_SEED } from '../seeds/manual-notification.seed';
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
        switch (target.type) {
          case 'all_members':
            return 42_580;
          case 'brands':
            return 8_420;
          case 'stores':
            return 1_240;
          case 'contract_type':
            return 5_640;
          case 'membership_duration':
            return 3_180;
          case 'dynamic_attribute':
            return {
              unpaid: 128,
              dormant: 1_840,
              withdrawal_pending: 32,
              birthday_month: 3_420,
              trial: 260,
            }[target.attribute];
          case 'members':
            return target.memberIds.length;
        }
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

import { MANUAL_NOTIFICATION_JOYFIT_SUB_BRANDS } from '@/lib/utils/manual-notification-target.util';

import type { DbType } from '../_db.types';
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

function getSeedTargetStoreIds(row: ManualNotificationRow, db: DbType): string[] {
  if (row.targetStoreIds.length > 0) return [...row.targetStoreIds];

  if (row.target.type === 'stores') {
    return [...new Set(row.target.stores.map((store) => store.id))];
  }
  if (row.target.type === 'members') {
    return [
      ...new Set(
        row.target.members.flatMap((member) => {
          const storeId = db.members.get(member.id)?.primaryStore.storeId;
          return storeId ? [storeId] : [];
        }),
      ),
    ];
  }

  let stores = db.stores.getList();
  if (row.recipientScopeStoreIds !== null) {
    stores = stores.filter((store) => row.recipientScopeStoreIds?.includes(store.id));
  }
  if (row.target.type === 'brands') {
    const selectedBrands = new Set(
      row.target.brands.flatMap((brand) =>
        brand === 'joyfit_all' ? [...MANUAL_NOTIFICATION_JOYFIT_SUB_BRANDS] : [brand],
      ),
    );
    stores = stores.filter((store) => selectedBrands.has(store.brand));
  }

  return stores.map((store) => store.id);
}

export function createManualNotificationTable(getDb: () => DbType): {
  manualNotifications: ManualNotificationsType;
} {
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
          recipientScopeStoreIds:
            row.recipientScopeStoreIds === null ? null : [...row.recipientScopeStoreIds],
          targetStoreIds: getSeedTargetStoreIds(row, getDb()),
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
        const maxIdNum = this._rows.reduce((max, row) => {
          const num = parseInt(row.id.replace('N-', ''), 10);
          return Number.isNaN(num) ? max : Math.max(max, num);
        }, 0);
        const nextId = `N-${String(maxIdNum + 1).padStart(3, '0')}`;
        const now = new Date().toISOString();
        const row: ManualNotificationRow = {
          ...input,
          id: nextId,
          createdAt: input.createdAt ?? now,
          updatedAt: now,
          deletedAt: null,
          channels: [...input.channels],
          recipientScopeStoreIds:
            input.recipientScopeStoreIds === null ? null : [...input.recipientScopeStoreIds],
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
        if ('returnReason' in input && input.returnReason === undefined) {
          delete row.returnReason;
        }
        Object.assign(row, input, {
          updatedAt: new Date().toISOString(),
          channels: [...input.channels],
          recipientScopeStoreIds:
            input.recipientScopeStoreIds === null ? null : [...input.recipientScopeStoreIds],
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

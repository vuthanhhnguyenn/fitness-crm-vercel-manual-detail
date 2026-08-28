import { countManualNotificationTarget } from '@/app/api/crm/notifications/_lib/manual-notification-target-count.util';
import { manualNotificationTargetToInput } from '@/app/api/crm/notifications/_lib/manual-notification-upsert.util';

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

/**
 * Seed rows whose `targetCount` is a placeholder that should be backfilled
 * with a live count from the member roster before the list/detail views
 * show it. Kept narrow: N-001/002 are `all_members` (counted at submit
 * time, seed value is fine); sent/sending rows carry their own
 * `deliveryResult.deliveredCount` for the post-delivery tally.
 *
 *   N-003  brands: ['joyfit24']                  sub-brand target
 *   N-006  contract_type: 'regular'              contract target
 *   N-007  brands: ['joyfit', 'fit365']          brand sub-group target
 */
const BACKFILL_TARGET_COUNT_IDS = new Set(['N-003', 'N-006', 'N-007']);

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
      _fillRealTargetCounts(): void {
        // Lazy backfill on every read — runs from the read methods below,
        // not from `_seed()`. Reason: `_create-db.ts` calls all `_seed()`
        // methods in a single pass (members on line 134, manualNotifications
        // on line 152). The util we call (countManualNotificationTarget) reads
        // `db.members.getList()` — and during the import-time evaluation of
        // the route table (e.g. from `generate-openapi`), the singleton is
        // still mid-construction, which crashes with a TDZ error. Doing the
        // backfill lazily guarantees the singleton is fully wired by the time
        // any read runs. Idempotent: same number is a no-op write.
        for (const row of this._rows) {
          if (BACKFILL_TARGET_COUNT_IDS.has(row.id)) {
            row.targetCount = countManualNotificationTarget(
              manualNotificationTargetToInput(row.target),
            );
          }
        }
      },
      getList() {
        this._seed();
        this._fillRealTargetCounts();
        return [...this._rows];
      },
      getById(id) {
        this._seed();
        this._fillRealTargetCounts();
        return this._rows.find((row) => row.id === id);
      },
      estimateTargetCount(target) {
        return countManualNotificationTarget(target);
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

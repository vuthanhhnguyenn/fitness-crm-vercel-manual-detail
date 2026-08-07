import type {
  CreateLockerRequest,
  LockerDetail,
  LockerHistoryItem,
  LockerListItem,
  LockerLockType,
  LockerReminderNotification,
  LockerSlotItem,
  LockerSlotOpenType,
  UpdateLockerRequest,
} from '@/app/api/_schemas/locker.schema';

import type { LockerDetailSeedMeta } from '../seeds/locker.seed';

export type LockersType = {
  _rows: LockerListItem[];
  _detailMetaById: Record<string, LockerDetailSeedMeta>;
  _historyByLockerId: Record<string, LockerHistoryItem[]>;
  _seeded: boolean;
  _seed(): void;
  getList(): LockerListItem[];
  getById(id: string): LockerListItem | undefined;
  getDetailById(id: string): LockerDetail | undefined;
  getHistoryById(id: string): LockerHistoryItem[];
  delete(id: string): boolean;
  releaseSlots(
    lockerId: string,
    slotNumbers: string[],
  ): { released_slot_numbers: string[] } | undefined;
  releaseSlotsBulk(
    items: Array<{ locker_id: string; slot_numbers: string[] }>,
  ): { released_slot_numbers: string[]; locker_ids: string[] } | undefined;
  updateSlot(
    lockerId: string,
    slotId: string,
    patch: {
      lock_type?: LockerLockType;
      open_type?: LockerSlotOpenType;
      width_cm?: number;
      height_cm?: number;
      depth_cm?: number;
      password?: string | null;
      contract_type_code?: string | null;
    },
  ): LockerSlotItem | undefined;
  sendSlotReminder(
    lockerId: string,
    slotId: string,
    reminderDays: 7 | 14 | 30,
  ): LockerReminderNotification[] | undefined;
  syncLockerListCounts(lockerId: string): void;
  getUsedLocationSymbols(storeId: string, excludeLockerId?: string): string[];
  create(input: CreateLockerRequest): LockerDetail;
  update(id: string, patch: UpdateLockerRequest): LockerDetail | undefined;
};

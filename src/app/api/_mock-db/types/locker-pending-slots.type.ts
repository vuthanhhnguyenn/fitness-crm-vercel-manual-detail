import type { LockerPendingSlotListItem } from '@/app/api/_schemas/locker.schema';

export type LockerPendingSlotsType = {
  _rows: LockerPendingSlotListItem[];
  _seeded: boolean;
  _seed(): void;
  getList(): LockerPendingSlotListItem[];
  listByLockerId(lockerId: string): LockerPendingSlotListItem[];
  deleteByLockerId(lockerId: string): void;
  removeBySlotNumber(lockerId: string, slotNumber: string): boolean;
};

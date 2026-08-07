import type { LockerSlotItem } from '@/app/api/_schemas/locker.schema';

export function filterLockerSlotsForExport(
  slots: LockerSlotItem[],
  pendingOnly: boolean,
): LockerSlotItem[] {
  const occupied = slots.filter((slot) => slot.status !== 'available');
  if (pendingOnly) {
    return occupied.filter((slot) => slot.status === 'pending_release');
  }

  return occupied;
}

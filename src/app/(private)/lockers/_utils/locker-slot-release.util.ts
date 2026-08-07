export type LockerSlotReleaseTarget = {
  id: string;
  locker_id: string;
  slot_number: string;
};

export function collectReleaseSlotNumbers<T extends { id: string; slot_number: string }>(
  selectedIds: Set<string>,
  items: T[],
  predicate?: (item: T) => boolean,
): string[] {
  return Array.from(selectedIds)
    .map((id) => items.find((item) => item.id === id))
    .filter((item): item is T => item !== undefined && (predicate?.(item) ?? true))
    .map((item) => item.slot_number);
}

export function groupReleaseTargetsByLocker(
  targets: LockerSlotReleaseTarget[],
): Map<string, string[]> {
  const groups = new Map<string, string[]>();

  for (const target of targets) {
    const existing = groups.get(target.locker_id) ?? [];
    existing.push(target.slot_number);
    groups.set(target.locker_id, existing);
  }

  return groups;
}

export function buildBulkReleaseRequestItems(
  targets: LockerSlotReleaseTarget[],
): Array<{ locker_id: string; slot_numbers: string[] }> {
  return Array.from(groupReleaseTargetsByLocker(targets).entries()).map(
    ([locker_id, slot_numbers]) => ({
      locker_id,
      slot_numbers: [...new Set(slot_numbers)],
    }),
  );
}

export function buildBulkReleaseRequestItemsFromLocker(
  lockerId: string,
  slotNumbers: string[],
): Array<{ locker_id: string; slot_numbers: string[] }> {
  return [{ locker_id: lockerId, slot_numbers: [...new Set(slotNumbers)] }];
}

export function releaseTargetsFromSelection(
  selection: Map<string, LockerSlotReleaseTarget>,
): LockerSlotReleaseTarget[] {
  return Array.from(selection.values());
}

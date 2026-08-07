import {
  LockerContractStatus,
  type LockerContractStatus as LockerContractStatusValue,
} from '@/lib/api/types.gen';

export const LOCKER_SLOT_STATUS_CELL_CLASSES: Record<LockerContractStatusValue, string> = {
  [LockerContractStatus.IN_USE]: 'border-info/20 bg-info/15 text-info',
  [LockerContractStatus.PENDING_RELEASE]: 'border-warning/20 bg-warning/15 text-warning',
  [LockerContractStatus.AVAILABLE]: 'border-border bg-background text-muted-foreground',
};
